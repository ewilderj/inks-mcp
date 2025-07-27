#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Fuse from 'fuse.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { InkColor, InkSearchData, SearchResult, ColorAnalysis, PaletteResult } from './types.js';
import { 
  hexToRgb, 
  bgrToRgb,
  rgbToBgr,
  rgbToHex, 
  findClosestInks, 
  getColorFamily, 
  getColorDescription, 
  createSearchResult 
} from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      }
    );

    this.setupToolHandlers();
    this.loadData();
  }

  private loadData() {
    try {
      // Load ink colors and convert BGR to RGB immediately
      const inkColorsPath = path.join(__dirname, '../data/ink-colors.json');
      const rawInkColors = JSON.parse(fs.readFileSync(inkColorsPath, 'utf8'));
      
      // Convert BGR to RGB at load time
      this.inkColors = rawInkColors.map((ink: any) => ({
        ...ink,
        rgb: bgrToRgb(ink.rgb) // Convert BGR data to true RGB
      }));

      // Load search metadata
      const searchDataPath = path.join(__dirname, '../data/search.json');
      this.inkSearchData = JSON.parse(fs.readFileSync(searchDataPath, 'utf8'));

      // Setup fuzzy search
      this.fuse = new Fuse(this.inkSearchData, {
        keys: ['fullname', 'name', 'maker'],
        threshold: 0.3,
        minMatchCharLength: 2,
        ignoreLocation: true,
      });

      console.error(`Loaded ${this.inkColors.length} inks and ${this.inkSearchData.length} search entries (BGR→RGB converted)`);
    } catch (error) {
      console.error('Error loading ink data:', error);
    }
  }

  private getInkMetadata(inkId: string): InkSearchData | undefined {
    return this.inkSearchData.find(item => item.ink_id === inkId);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
              },
              required: ['color'],
            },
          },
          {
            name: 'get_color_palette',
            description: 'Generate a themed palette of inks',
            inputSchema: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  description: 'Theme for the palette (e.g., "warm", "cool", "earth", "ocean")',
                },
                palette_size: {
                  type: 'number',
                  description: 'Number of inks in the palette (default: 5)',
                  default: 5,
                },
              },
              required: ['theme'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error('Missing arguments');
      }

      try {
        switch (name) {
          case 'search_inks_by_name':
            return await this.searchInksByName(
              args.query as string, 
              (args.max_results as number) || 20
            );

          case 'search_inks_by_color':
            return await this.searchInksByColor(
              args.color as string, 
              (args.max_results as number) || 20
            );

          case 'get_ink_details':
            return await this.getInkDetails(args.ink_id as string);

          case 'get_inks_by_maker':
            return await this.getInksByMaker(
              args.maker as string, 
              (args.max_results as number) || 50
            );

          case 'analyze_color':
            return await this.analyzeColor(args.color as string);

          case 'get_color_palette':
            return await this.getColorPalette(
              args.theme as string, 
              (args.palette_size as number) || 5
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
        };
      }
    });
  }

  private async searchInksByName(query: string, maxResults: number) {
    const searchResults = this.fuse.search(query);
    const results: SearchResult[] = [];

    for (const result of searchResults.slice(0, maxResults)) {
      const metadata = result.item;
      const inkColor = this.inkColors.find(ink => ink.ink_id === metadata.ink_id);
      
      if (inkColor) {
        results.push(createSearchResult(inkColor, metadata));
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            results_count: results.length,
            results,
          }, null, 2),
        },
      ],
    };
  }

  private async searchInksByColor(colorHex: string, maxResults: number) {
    try {
      const targetRgb = hexToRgb(colorHex);
      const closestInks = findClosestInks(targetRgb, this.inkColors, maxResults);
      
      const results: SearchResult[] = closestInks.map(ink => {
        const metadata = this.getInkMetadata(ink.ink_id);
        return createSearchResult(ink, metadata, ink.distance);
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              target_color: colorHex,
              target_rgb: targetRgb,
              results_count: results.length,
              results,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Invalid color format: ${colorHex}. Please use hex format like #FF5733`);
    }
  }

  private async getInkDetails(inkId: string) {
    const inkColor = this.inkColors.find(ink => ink.ink_id === inkId);
    const metadata = this.getInkMetadata(inkId);

    if (!inkColor) {
      throw new Error(`Ink not found: ${inkId}`);
    }

    const result = createSearchResult(inkColor, metadata);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ink_details: result,
            hex_color: rgbToHex(inkColor.rgb), // Now actually RGB!
            color_family: getColorFamily(inkColor.rgb),
            color_description: getColorDescription(inkColor.rgb),
          }, null, 2),
        },
      ],
    };
  }

  private async getInksByMaker(maker: string, maxResults: number) {
    const makerLower = maker.toLowerCase();
    const makerInks = this.inkSearchData.filter(item => 
      item.maker.toLowerCase() === makerLower
    ).slice(0, maxResults);

    const results: SearchResult[] = [];
    
    for (const metadata of makerInks) {
      const inkColor = this.inkColors.find(ink => ink.ink_id === metadata.ink_id);
      if (inkColor) {
        results.push(createSearchResult(inkColor, metadata));
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            maker,
            results_count: results.length,
            results,
          }, null, 2),
        },
      ],
    };
  }

  private async analyzeColor(colorHex: string): Promise<any> {
    try {
      const rgb = hexToRgb(colorHex);
      const closestInks = findClosestInks(rgb, this.inkColors, 5);
      
      const results: SearchResult[] = closestInks.map(ink => {
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
      };
    } catch (error) {
      throw new Error(`Invalid color format: ${colorHex}. Please use hex format like #FF5733`);
    }
  }

  private async getColorPalette(theme: string, paletteSize: number): Promise<any> {
    // TODO: Improve color palette generation strategy
    // Issues to address:
    // 1. Silent fallback to 'cool' theme for unknown themes (user doesn't know they got fallback)
    // 2. Limited predefined themes - should add: summer, winter, pastel, vibrant, monochrome, sunset, forest
    // 3. No way to specify custom color targets - should allow hex color arrays as theme input
    // 4. Palette generation could be smarter - currently just finds closest match to predefined colors
    // 5. Should validate theme names and provide helpful error messages
    // 6. Could add color harmony rules (complementary, triadic, analogous) for better palettes
    // 7. Palette size is limited by number of predefined colors (usually 5) - should generate more varied colors
    // 8. No deduplication - could return same ink multiple times if it's closest to multiple target colors
    
    const themeColors: { [key: string]: [number, number, number][] } = {
      warm: [[255, 100, 50], [255, 150, 0], [200, 80, 80], [180, 120, 60], [220, 180, 100]],
      cool: [[50, 150, 255], [100, 200, 200], [150, 100, 255], [80, 180, 150], [120, 120, 200]],
      earth: [[139, 69, 19], [160, 82, 45], [210, 180, 140], [107, 142, 35], [85, 107, 47]],
      ocean: [[0, 119, 190], [0, 150, 136], [72, 201, 176], [135, 206, 235], [25, 25, 112]],
      autumn: [[255, 140, 0], [255, 69, 0], [220, 20, 60], [184, 134, 11], [139, 69, 19]],
      spring: [[154, 205, 50], [124, 252, 0], [173, 255, 47], [50, 205, 50], [0, 255, 127]],
    };

    const targetColors = themeColors[theme.toLowerCase()] || themeColors.cool;
    const paletteInks: SearchResult[] = [];

    for (let i = 0; i < Math.min(paletteSize, targetColors.length); i++) {
      const targetRgb = targetColors[i];
      const closestInks = findClosestInks(targetRgb, this.inkColors, 1);
      
      if (closestInks.length > 0) {
        const ink = closestInks[0];
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
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new InkMCPServer();
server.run().catch(console.error);
