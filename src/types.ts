// Type definitions for ink data structures

export interface InkColor {
  fullname: string;
  ink_id: string;
  rgb: [number, number, number]; // Now actually RGB format [R, G, B] - converted at load time!
}

export interface InkSearchData {
  ink_id: string;
  name: string;
  scanned: string; // ISO date string
  fullname: string;
  maker: string;
}

export interface InkWithDistance extends InkColor {
  distance?: number; // For color similarity calculations
}

export interface SearchResult {
  ink: InkColor;
  metadata?: InkSearchData;
  distance?: number;
  url?: string;
  image_url?: string;
}

export interface TemperatureAnalysis {
  kelvin: number;
  category: 'warm' | 'cool' | 'neutral';
  description: string;
  intensity: number; // 0-1 scale (calculated from deviation from neutral)
  seasonal_match: string[];
  complementary_temperature: number;
}

export interface ColorAnalysis {
  hex: string;
  rgb: [number, number, number];
  closest_inks: SearchResult[];
  color_family: string;
  description: string;
}

export interface ColorAnalysisWithTemperature extends ColorAnalysis {
  temperature: TemperatureAnalysis;
  temperature_recommendations?: {
    similar_temperature_inks: SearchResult[];
    contrasting_temperature_inks: SearchResult[];
    seasonal_suggestions: string[];
  };
}

export interface PaletteResult {
  theme: string;
  inks: SearchResult[];
  description: string;
  temperature_analysis?: {
    average_temperature: number;
    temperature_range: [number, number];
    dominant_category: 'warm' | 'cool' | 'neutral';
    temperature_harmony: 'monochromatic' | 'complementary' | 'mixed';
  };
}
