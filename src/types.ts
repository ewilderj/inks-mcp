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

export interface ColorAnalysis {
  hex: string;
  rgb: [number, number, number];
  closest_inks: SearchResult[];
  color_family: string;
  description: string;
}

export interface PaletteResult {
  theme: string;
  inks: SearchResult[];
  description: string;
}
