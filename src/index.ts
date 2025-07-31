#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import Fuse from 'fuse.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type {
  InkColor,
  InkSearchData,
  SearchResult,
  ColorAnalysis,
  PaletteResult,
} from './types.js';
import {
  hexToRgb,
  bgrToRgb,
  rgbToHex,
  findClosestInks,
  getColorFamily,
  getColorDescription,
  createSearchResult,
  rgbToHsl,
  hslToRgb,
  generateHarmonyColors,
} from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper types
type MCPTextResponse = { content: Array<{ type: 'text'; text: string }> };
type Harmony = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';

type RawInkColor = {
  fullname: string;
  ink_id: string;
  rgb: [number, number, number]; // Source BGR triplet in data file
};

class InkMCPServer {
  private server: Server;
  private inkColors: InkColor[] = [];
  private inkSearchData: InkSearchData[] = [];
  private fuse!: Fuse<InkSearchData>;

  constructor() {
    this.server = new Server(
      {
        name: 'fountain-pen-ink-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    this.loadData();
  }

  private loadData() {
    try {
      // Load ink colors and convert BGR to RGB immediately
      const inkColorsPath = path.join(__dirname, '../data/ink-colors.json');
      const inkColorsText = fs.readFileSync(inkColorsPath, 'utf8');
      const parsedInkColors = JSON.parse(inkColorsText) as unknown;
      if (!Array.isArray(parsedInkColors)) {
        throw new Error('Invalid ink-colors.json format: expected an array');
      }

      // Convert BGR to RGB at load time
      this.inkColors = (parsedInkColors as RawInkColor[]).map((ink) => ({
        ...ink,
        rgb: bgrToRgb(ink.rgb), // Convert BGR data to true RGB
      }));

      // Load search metadata
      const searchDataPath = path.join(__dirname, '../data/search.json');
      const searchText = fs.readFileSync(searchDataPath, 'utf8');
      const parsedSearch = JSON.parse(searchText) as unknown;
      if (!Array.isArray(parsedSearch)) {
        throw new Error('Invalid search.json format: expected an array');
      }
      this.inkSearchData = parsedSearch as InkSearchData[];

      // Setup fuzzy search
      this.fuse = new Fuse(this.inkSearchData, {
        keys: ['fullname', 'name', 'maker'],
        threshold: 0.3,
        minMatchCharLength: 2,
        ignoreLocation: true,
      });

      console.error(
        `Loaded ${this.inkColors.length} inks and ${this.inkSearchData.length} search entries (BGR→RGB converted)`,
      );
    } catch (error) {
      console.error('Error loading ink data:', error);
    }
  }

  private getInkMetadata(inkId: string): InkSearchData | undefined {
    return this.inkSearchData.find((item) => item.ink_id === inkId);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: [
          {
            name: 'search_inks_by_name',
            description: 'Search for fountain pen inks by name using fuzzy matching',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search term for ink name',
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 20)',
                  default: 20,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'search_inks_by_color',
            description: 'Find inks similar to a given color using RGB matching',
            inputSchema: {
              type: 'object',
              properties: {
                color: {
                  type: 'string',
                  description: 'Hex color code (e.g., "#FF5733")',
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 20)',
                  default: 20,
                },
              },
              required: ['color'],
            },
          },
          {
            name: 'get_ink_details',
            description: 'Get complete information about a specific ink',
            inputSchema: {
              type: 'object',
              properties: {
                ink_id: {
                  type: 'string',
                  description: 'The unique identifier for the ink',
                },
              },
              required: ['ink_id'],
            },
          },
          {
            name: 'get_inks_by_maker',
            description: 'List all inks from a specific manufacturer',
            inputSchema: {
              type: 'object',
              properties: {
                maker: {
                  type: 'string',
                  description: 'Manufacturer name (e.g., "sailor", "diamine")',
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 50)',
                  default: 50,
                },
              },
              required: ['maker'],
            },
          },
          {
            name: 'analyze_color',
            description: 'Analyze a color and provide ink knowledge context',
            inputSchema: {
              type: 'object',
              properties: {
                color: {
                  type: 'string',
                  description: 'Hex color code (e.g., "#FF5733")',
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of closest inks to return (default: 5)',
                  default: 5,
                },
              },
              required: ['color'],
            },
          },
          {
            name: 'get_color_palette',
            description:
              'Generate a themed or harmony-based palette of inks. Supports three modes: 1) Predefined themes (warm, cool, earth, ocean, autumn, spring, summer, winter, pastel, vibrant, monochrome, sunset, forest), 2) Custom hex color lists (comma-separated), 3) Color harmony generation from a base hex color.',
            inputSchema: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  description:
                    'Theme name (e.g., "warm", "ocean"), comma-separated hex colors (e.g., "#FF0000,#00FF00"), or single hex color for harmony generation (e.g., "#FF0000").',
                },
                palette_size: {
                  type: 'number',
                  description: 'Number of inks in the palette (default: 5)',
                  default: 5,
                },
                harmony: {
                  type: 'string',
                  description:
                    'Color harmony rule to apply when theme is a single hex color. Options: "complementary", "analogous", "triadic", "split-complementary". Requires theme to be a valid hex color.',
                  enum: ['complementary', 'analogous', 'triadic', 'split-complementary'],
                },
              },
              required: ['theme'],
              additionalProperties: false,
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error('Missing arguments');
      }

      try {
        switch (name) {
          case 'search_inks_by_name':
            return this.searchInksByName(
              args.query as string,
              (args.max_results as number) || 20,
            );

          case 'search_inks_by_color':
            return this.searchInksByColor(
              args.color as string,
              (args.max_results as number) || 20,
            );

          case 'get_ink_details':
            return this.getInkDetails(args.ink_id as string);

          case 'get_inks_by_maker':
            return this.getInksByMaker(
              args.maker as string,
              (args.max_results as number) || 50,
            );

          case 'analyze_color':
            return this.analyzeColor(args.color as string, (args.max_results as number) || 5);

          case 'get_color_palette':
            return this.getColorPalette(
              args.theme as string,
              (args.palette_size as number) || 5,
              args.harmony as Harmony,
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        } satisfies MCPTextResponse;
      }
    });
  }

  private searchInksByName(query: string, maxResults: number): MCPTextResponse {
    const searchResults = this.fuse.search(query);
    const results: SearchResult[] = [];

    for (const result of searchResults.slice(0, maxResults)) {
      const metadata = result.item;
      const inkColor = this.inkColors.find((ink) => ink.ink_id === metadata.ink_id);

      if (inkColor) {
        results.push(createSearchResult(inkColor, metadata));
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query,
              results_count: results.length,
              results,
            },
            null,
            2,
          ),
        },
      ],
    } satisfies MCPTextResponse;
  }

  private searchInksByColor(colorHex: string, maxResults: number): MCPTextResponse {
    try {
      const targetRgb = hexToRgb(colorHex);
      const closestInks = findClosestInks(targetRgb, this.inkColors, maxResults);

      const results: SearchResult[] = closestInks.map((ink) => {
        const metadata = this.getInkMetadata(ink.ink_id);
        return createSearchResult(ink, metadata, ink.distance);
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                target_color: colorHex,
                target_rgb: targetRgb,
                results_count: results.length,
                results,
              },
              null,
              2,
            ),
          },
        ],
      } satisfies MCPTextResponse;
    } catch {
      throw new Error(`Invalid color format: ${colorHex}. Please use hex format like #FF5733`);
    }
  }

  private getInkDetails(inkId: string): MCPTextResponse {
    const inkColor = this.inkColors.find((ink) => ink.ink_id === inkId);
    const metadata = this.getInkMetadata(inkId);

    if (!inkColor) {
      throw new Error(`Ink not found: ${inkId}`);
    }

    const result = createSearchResult(inkColor, metadata);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ink_details: result,
              hex_color: rgbToHex(inkColor.rgb), // Now actually RGB!
              color_family: getColorFamily(inkColor.rgb),
              color_description: getColorDescription(inkColor.rgb),
            },
            null,
            2,
          ),
        },
      ],
    } satisfies MCPTextResponse;
  }

  private getInksByMaker(maker: string, maxResults: number): MCPTextResponse {
    const makerLower = maker.toLowerCase();
    const makerInks = this.inkSearchData
      .filter((item) => item.maker.toLowerCase() === makerLower)
      .slice(0, maxResults);

    const results: SearchResult[] = [];

    for (const metadata of makerInks) {
      const inkColor = this.inkColors.find((ink) => ink.ink_id === metadata.ink_id);
      if (inkColor) {
        results.push(createSearchResult(inkColor, metadata));
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              maker,
              results_count: results.length,
              results,
            },
            null,
            2,
          ),
        },
      ],
    } satisfies MCPTextResponse;
  }

  private analyzeColor(colorHex: string, maxResults: number = 5): MCPTextResponse {
    try {
      const rgb = hexToRgb(colorHex);
      const closestInks = findClosestInks(rgb, this.inkColors, maxResults);

      const results: SearchResult[] = closestInks.map((ink) => {
        const metadata = this.getInkMetadata(ink.ink_id);
        return createSearchResult(ink, metadata, ink.distance);
      });

      const analysis: ColorAnalysis = {
        hex: colorHex,
        rgb,
        closest_inks: results,
        color_family: getColorFamily(rgb), // No conversion needed
        description: getColorDescription(rgb), // No conversion needed
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      } satisfies MCPTextResponse;
    } catch {
      throw new Error(`Invalid color format: ${colorHex}. Please use hex format like #FF5733`);
    }
  }

  private getColorPalette(
    theme: string,
    paletteSize: number,
    harmony?: Harmony,
  ): MCPTextResponse {
    const themeColors: { [key: string]: [number, number, number][] } = {
      warm: [
        [255, 100, 50],
        [255, 150, 0],
        [200, 80, 80],
        [180, 120, 60],
        [220, 180, 100],
      ],
      cool: [
        [50, 150, 255],
        [100, 200, 200],
        [150, 100, 255],
        [80, 180, 150],
        [120, 120, 200],
      ],
      earth: [
        [139, 69, 19],
        [160, 82, 45],
        [210, 180, 140],
        [107, 142, 35],
        [85, 107, 47],
      ],
      ocean: [
        [0, 119, 190],
        [0, 150, 136],
        [72, 201, 176],
        [135, 206, 235],
        [25, 25, 112],
      ],
      autumn: [
        [255, 140, 0],
        [255, 69, 0],
        [220, 20, 60],
        [184, 134, 11],
        [139, 69, 19],
      ],
      spring: [
        [154, 205, 50],
        [124, 252, 0],
        [173, 255, 47],
        [50, 205, 50],
        [0, 255, 127],
      ],
      summer: [
        [255, 235, 59],
        [255, 193, 7],
        [76, 175, 80],
        [139, 195, 74],
        [3, 169, 244],
      ],
      winter: [
        [224, 224, 224],
        [144, 164, 174],
        [96, 125, 139],
        [33, 150, 243],
        [0, 0, 128],
      ],
      pastel: [
        [255, 204, 204],
        [204, 255, 204],
        [204, 204, 255],
        [255, 255, 204],
        [255, 204, 255],
      ],
      vibrant: [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
        [255, 0, 255],
      ],
      monochrome: [
        [255, 255, 255],
        [224, 224, 224],
        [192, 192, 192],
        [128, 128, 128],
        [64, 64, 64],
        [0, 0, 0],
      ],
      sunset: [
        [255, 224, 130],
        [255, 170, 85],
        [255, 110, 80],
        [200, 80, 120],
        [100, 60, 110],
      ],
      forest: [
        [34, 85, 34],
        [20, 60, 20],
        [60, 100, 60],
        [100, 140, 100],
        [140, 180, 140],
      ],
    };

    let targetColors: [number, number, number][];
    const lowerCaseTheme = theme.toLowerCase();

    if (harmony) {
      try {
        const baseRgb = hexToRgb(theme);
        const baseHsl = rgbToHsl(baseRgb);
        const harmonyHsl = generateHarmonyColors(baseHsl, harmony);
        targetColors = harmonyHsl.map((hsl) => hslToRgb(hsl));
      } catch {
        throw new Error('Invalid base color for harmony rule. Please use a single valid hex code.');
      }
    } else if (themeColors[lowerCaseTheme]) {
      targetColors = themeColors[lowerCaseTheme];
    } else if (theme.startsWith('#') || theme.includes(',')) {
      try {
        targetColors = theme.split(',').map((hex) => hexToRgb(hex.trim()));
      } catch {
        throw new Error(
          'Invalid custom palette format. Please use a comma-separated list of hex codes, e.g., "#FF0000,#00FF00,#0000FF"',
        );
      }
    } else {
      throw new Error(
        `Unknown theme: "${theme}". Available themes are: ${Object.keys(themeColors).join(', ')}`,
      );
    }

    const paletteInks: SearchResult[] = [];
    const usedInkIds = new Set<string>();

    for (let i = 0; i < Math.min(paletteSize, targetColors.length); i++) {
      const targetRgb = targetColors[i];
      const closestInks = findClosestInks(targetRgb, this.inkColors, 5).filter(
        (ink) => !usedInkIds.has(ink.ink_id),
      );

      if (closestInks.length > 0) {
        const ink = closestInks[0];
        usedInkIds.add(ink.ink_id);
        const metadata = this.getInkMetadata(ink.ink_id);
        paletteInks.push(createSearchResult(ink, metadata, ink.distance));
      }
    }

    const palette: PaletteResult = {
      theme,
      inks: paletteInks,
      description: `A curated palette of ${paletteInks.length} fountain pen inks matching the ${theme} theme.`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(palette, null, 2),
        },
      ],
    } satisfies MCPTextResponse;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new InkMCPServer();
server.run().catch(console.error);
