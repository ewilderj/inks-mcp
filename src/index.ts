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

import { InkColor, InkSearchData, SearchResult, ColorAnalysis, PaletteResult, TemperatureAnalysis, ColorAnalysisWithTemperature } from './types.js';
import {
  hexToRgb,
  bgrToRgb,
  rgbToBgr,
  rgbToHex,
  findClosestInks,
  getColorFamily,
  getColorDescription,
  createSearchResult,
  rgbToHsl,
  hslToRgb,
  generateHarmonyColors,
  calculateColorTemperature,
  getTemperatureCategory,
  getTemperatureDescription,
  getColorFamilyTemperatureBias,
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
                temperature_filter: {
                  type: 'string',
                  description: 'Filter by temperature category: "warm", "cool", or "neutral"',
                  enum: ['warm', 'cool', 'neutral'],
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
            name: 'analyze_color_temperature',
            description: 'Analyze color temperature characteristics of a given color',
            inputSchema: {
              type: 'object',
              properties: {
                color: {
                  type: 'string',
                  description: 'Hex color code (e.g., "#FF5733")',
                },
                include_recommendations: {
                  type: 'boolean',
                  description: 'Include temperature-based ink recommendations',
                  default: false,
                },
              },
              required: ['color'],
            },
          },
          {
            name: 'get_color_palette',
            description: 'Generate a themed or harmony-based palette of inks. Supports three modes: 1) Predefined themes (warm, cool, neutral, earth, ocean, autumn, spring, summer, winter, pastel, vibrant, monochrome, sunset, forest, warm-reds, cool-blues, neutral-grays, temperature-gradient), 2) Custom hex color lists (comma-separated), 3) Color harmony generation from a base hex color. Includes temperature analysis for all palettes.',
            inputSchema: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  description: 'Theme name (e.g., "warm", "ocean"), comma-separated hex colors (e.g., "#FF0000,#00FF00"), or single hex color for harmony generation (e.g., "#FF0000").',
                },
                palette_size: {
                  type: 'number',
                  description: 'Number of inks in the palette (default: 5)',
                  default: 5,
                },
                harmony: {
                  type: 'string',
                  description: 'Color harmony rule to apply when theme is a single hex color. Options: "complementary", "analogous", "triadic", "split-complementary". Requires theme to be a valid hex color.',
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
              (args.max_results as number) || 20,
              args.temperature_filter as 'warm' | 'cool' | 'neutral' | undefined
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

          case 'analyze_color_temperature':
            return await this.analyzeColorTemperature(
              args.color as string,
              args.include_recommendations as boolean || false
            );

          case 'get_color_palette':
            return await this.getColorPalette(
              args.theme as string,
              (args.palette_size as number) || 5,
              args.harmony as any
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

  private async searchInksByColor(
    colorHex: string, 
    maxResults: number, 
    temperatureFilter?: 'warm' | 'cool' | 'neutral'
  ) {
    try {
      const targetRgb = hexToRgb(colorHex);
      let closestInks = findClosestInks(targetRgb, this.inkColors, maxResults * 2); // Get more to filter
      
      // Apply temperature filter if specified
      if (temperatureFilter) {
        closestInks = closestInks.filter(ink => {
          const inkTemp = calculateColorTemperature(ink.rgb);
          const inkCategory = getTemperatureCategory(inkTemp);
          return inkCategory === temperatureFilter;
        });
      }
      
      // Limit to requested number of results
      closestInks = closestInks.slice(0, maxResults);
      
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
              temperature_filter: temperatureFilter || 'none',
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

      // Add temperature analysis to existing color analysis
      const tempKelvin = calculateColorTemperature(rgb);
      const temperatureAnalysis: TemperatureAnalysis = {
        kelvin: tempKelvin,
        category: getTemperatureCategory(tempKelvin),
        description: getTemperatureDescription(rgb),
        intensity: this.calculateTemperatureIntensity(tempKelvin),
        seasonal_match: this.getSeasonalMatches(tempKelvin, getColorFamily(rgb)),
        complementary_temperature: this.getComplementaryTemperature(tempKelvin),
      };

      const analysis: ColorAnalysisWithTemperature = {
        hex: colorHex,
        rgb,
        closest_inks: results,
        color_family: getColorFamily(rgb),
        description: getColorDescription(rgb),
        temperature: temperatureAnalysis,
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

  private async analyzeColorTemperature(colorHex: string, includeRecommendations: boolean): Promise<any> {
    try {
      const rgb = hexToRgb(colorHex);
      const tempKelvin = calculateColorTemperature(rgb);
      const colorFamily = getColorFamily(rgb);
      
      const temperatureAnalysis: TemperatureAnalysis = {
        kelvin: tempKelvin,
        category: getTemperatureCategory(tempKelvin),
        description: getTemperatureDescription(rgb),
        intensity: this.calculateTemperatureIntensity(tempKelvin),
        seasonal_match: this.getSeasonalMatches(tempKelvin, colorFamily),
        complementary_temperature: this.getComplementaryTemperature(tempKelvin),
      };

      let result: any = {
        color: colorHex,
        rgb,
        color_family: colorFamily,
        temperature: temperatureAnalysis,
      };

      if (includeRecommendations) {
        const recommendations = await this.getTemperatureBasedRecommendations(rgb, tempKelvin);
        result.temperature_recommendations = recommendations;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Invalid color format: ${colorHex}. Please use hex format like #FF5733`);
    }
  }

  private calculateTemperatureIntensity(tempKelvin: number): number {
    // Calculate intensity as deviation from neutral (4250K midpoint)
    const neutral = 4250;
    const maxDeviation = 2250; // From 2000K to 6500K
    const deviation = Math.abs(tempKelvin - neutral);
    return Math.min(1, deviation / maxDeviation);
  }

  private getSeasonalMatches(tempKelvin: number, colorFamily: string): string[] {
    const seasons: string[] = [];
    
    if (tempKelvin < 3200) { // Very warm
      seasons.push('autumn', 'winter');
    } else if (tempKelvin < 3800) { // Warm
      seasons.push('autumn');
      if (colorFamily === 'yellow' || colorFamily === 'orange') {
        seasons.push('summer');
      }
    } else if (tempKelvin < 5200) { // Neutral
      seasons.push('spring', 'summer', 'autumn');
    } else if (tempKelvin < 6000) { // Cool
      seasons.push('spring', 'summer');
    } else { // Very cool
      seasons.push('winter', 'spring');
    }
    
    return seasons;
  }

  private getComplementaryTemperature(tempKelvin: number): number {
    // Calculate complementary temperature (opposite on the warm/cool spectrum)
    const neutral = 4250;
    const distance = tempKelvin - neutral;
    return Math.max(2000, Math.min(8000, neutral - distance));
  }

  private async getTemperatureBasedRecommendations(
    targetRgb: [number, number, number], 
    targetTemp: number
  ): Promise<{
    similar_temperature_inks: SearchResult[];
    contrasting_temperature_inks: SearchResult[];
    seasonal_suggestions: string[];
  }> {
    // Find inks with similar and contrasting temperatures
    const temperatureThreshold = 500; // Kelvin
    const contrastThreshold = 1500; // Kelvin
    
    const allInksWithTemperature = this.inkColors.map(ink => {
      const inkTemp = calculateColorTemperature(ink.rgb);
      return {
        ...ink,
        temperature: inkTemp,
        temperatureDifference: Math.abs(inkTemp - targetTemp),
      };
    });

    // Similar temperature inks
    const similarTempInks = allInksWithTemperature
      .filter(ink => ink.temperatureDifference <= temperatureThreshold)
      .sort((a, b) => a.temperatureDifference - b.temperatureDifference)
      .slice(0, 5)
      .map(ink => {
        const metadata = this.getInkMetadata(ink.ink_id);
        return createSearchResult(ink, metadata, ink.temperatureDifference);
      });

    // Contrasting temperature inks
    const contrastingTempInks = allInksWithTemperature
      .filter(ink => ink.temperatureDifference >= contrastThreshold)
      .sort((a, b) => b.temperatureDifference - a.temperatureDifference)
      .slice(0, 5)
      .map(ink => {
        const metadata = this.getInkMetadata(ink.ink_id);
        return createSearchResult(ink, metadata, ink.temperatureDifference);
      });

    const colorFamily = getColorFamily(targetRgb);
    const seasonalSuggestions = this.getSeasonalMatches(targetTemp, colorFamily);

    return {
      similar_temperature_inks: similarTempInks,
      contrasting_temperature_inks: contrastingTempInks,
      seasonal_suggestions: seasonalSuggestions,
    };
  }

  private async getColorPalette(
    theme: string, 
    paletteSize: number,
    harmony?: 'complementary' | 'analogous' | 'triadic' | 'split-complementary'
  ): Promise<any> {
    const themeColors: { [key: string]: [number, number, number][] } = {
      warm: [[255, 100, 50], [255, 150, 0], [200, 80, 80], [180, 120, 60], [220, 180, 100]],
      cool: [[50, 150, 255], [100, 200, 200], [150, 100, 255], [80, 180, 150], [120, 120, 200]],
      neutral: [[140, 140, 140], [160, 160, 160], [120, 130, 125], [135, 125, 130], [125, 135, 140]],
      earth: [[139, 69, 19], [160, 82, 45], [210, 180, 140], [107, 142, 35], [85, 107, 47]],
      ocean: [[0, 119, 190], [0, 150, 136], [72, 201, 176], [135, 206, 235], [25, 25, 112]],
      autumn: [[255, 140, 0], [255, 69, 0], [220, 20, 60], [184, 134, 11], [139, 69, 19]],
      spring: [[154, 205, 50], [124, 252, 0], [173, 255, 47], [50, 205, 50], [0, 255, 127]],
      summer: [[255, 235, 59], [255, 193, 7], [76, 175, 80], [139, 195, 74], [3, 169, 244]],
      winter: [[224, 224, 224], [144, 164, 174], [96, 125, 139], [33, 150, 243], [0, 0, 128]],
      pastel: [[255, 204, 204], [204, 255, 204], [204, 204, 255], [255, 255, 204], [255, 204, 255]],
      vibrant: [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255]],
      monochrome: [[255, 255, 255], [224, 224, 224], [192, 192, 192], [128, 128, 128], [64, 64, 64], [0, 0, 0]],
      sunset: [[255, 224, 130], [255, 170, 85], [255, 110, 80], [200, 80, 120], [100, 60, 110]],
      forest: [[34, 85, 34], [20, 60, 20], [60, 100, 60], [100, 140, 100], [140, 180, 140]],
      // New temperature-specific themes
      'warm-reds': [[200, 50, 50], [255, 100, 80], [220, 80, 60], [255, 130, 100], [180, 40, 40]],
      'cool-blues': [[50, 100, 200], [80, 150, 255], [100, 180, 230], [60, 120, 180], [40, 80, 160]],
      'neutral-grays': [[120, 120, 120], [140, 140, 140], [160, 160, 160], [100, 100, 100], [180, 180, 180]],
      'temperature-gradient': [[255, 80, 50], [255, 150, 100], [180, 180, 180], [100, 150, 200], [50, 100, 255]], // Warm to cool
    };

    let targetColors: [number, number, number][];
    const lowerCaseTheme = theme.toLowerCase();

    if (harmony) {
      try {
        const baseRgb = hexToRgb(theme);
        const baseHsl = rgbToHsl(baseRgb);
        const harmonyHsl = generateHarmonyColors(baseHsl, harmony);
        targetColors = harmonyHsl.map(hsl => hslToRgb(hsl));
      } catch (error) {
        throw new Error('Invalid base color for harmony rule. Please use a single valid hex code.');
      }
    } else if (themeColors[lowerCaseTheme]) {
      targetColors = themeColors[lowerCaseTheme];
    } else if (theme.startsWith('#') || theme.includes(',')) {
      try {
        targetColors = theme.split(',').map(hex => hexToRgb(hex.trim()));
      } catch (error) {
        throw new Error('Invalid custom palette format. Please use a comma-separated list of hex codes, e.g., "#FF0000,#00FF00,#0000FF"');
      }
    } else {
      throw new Error(`Unknown theme: "${theme}". Available themes are: ${Object.keys(themeColors).join(', ')}`);
    }

    const paletteInks: SearchResult[] = [];
    const usedInkIds = new Set<string>();

    for (let i = 0; i < Math.min(paletteSize, targetColors.length); i++) {
      const targetRgb = targetColors[i];
      const closestInks = findClosestInks(targetRgb, this.inkColors, 5).filter(ink => !usedInkIds.has(ink.ink_id));
      
      if (closestInks.length > 0) {
        const ink = closestInks[0];
        usedInkIds.add(ink.ink_id);
        const metadata = this.getInkMetadata(ink.ink_id);
        paletteInks.push(createSearchResult(ink, metadata, ink.distance));
      }
    }

    // Calculate temperature analysis for the palette
    const temperatureAnalysis = this.calculatePaletteTemperatureAnalysis(paletteInks);

    const palette: PaletteResult = {
      theme,
      inks: paletteInks,
      description: `A curated palette of ${paletteInks.length} fountain pen inks matching the ${theme} theme.`,
      temperature_analysis: temperatureAnalysis,
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

  private calculatePaletteTemperatureAnalysis(inks: SearchResult[]): {
    average_temperature: number;
    temperature_range: [number, number];
    dominant_category: 'warm' | 'cool' | 'neutral';
    temperature_harmony: 'monochromatic' | 'complementary' | 'mixed';
  } {
    if (inks.length === 0) {
      return {
        average_temperature: 4250,
        temperature_range: [4250, 4250],
        dominant_category: 'neutral',
        temperature_harmony: 'monochromatic',
      };
    }

    // Calculate temperatures for all inks
    const temperatures = inks.map(result => calculateColorTemperature(result.ink.rgb));
    const categories = temperatures.map(temp => getTemperatureCategory(temp));

    // Calculate statistics
    const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);

    // Determine dominant category
    const categoryCounts = { warm: 0, cool: 0, neutral: 0 };
    categories.forEach(cat => categoryCounts[cat]++);
    const dominantCategory = Object.entries(categoryCounts)
      .reduce((max, [cat, count]) => count > max[1] ? [cat, count] : max, ['neutral', 0])[0] as 'warm' | 'cool' | 'neutral';

    // Determine temperature harmony
    let temperatureHarmony: 'monochromatic' | 'complementary' | 'mixed';
    const tempRange = maxTemp - minTemp;
    
    if (tempRange < 800) { // Close temperatures
      temperatureHarmony = 'monochromatic';
    } else if (tempRange > 2000 && categories.includes('warm') && categories.includes('cool')) {
      temperatureHarmony = 'complementary';
    } else {
      temperatureHarmony = 'mixed';
    }

    return {
      average_temperature: Math.round(avgTemp),
      temperature_range: [minTemp, maxTemp],
      dominant_category: dominantCategory,
      temperature_harmony: temperatureHarmony,
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new InkMCPServer();
server.run().catch(console.error);
