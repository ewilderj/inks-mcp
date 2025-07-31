// Type definitions for ink data structures

/**
 * Represents a fountain pen ink with its color information
 * @public
 */
export interface InkColor {
  /** Full name of the ink including maker and color name */
  fullname: string;
  /** Unique identifier for the ink */
  ink_id: string;
  /** RGB color values [R, G, B] with values 0-255 (converted from BGR at load time) */
  rgb: [number, number, number];
}

/**
 * Search metadata for fountain pen inks
 * @public
 */
export interface InkSearchData {
  /** Unique identifier for the ink */
  ink_id: string;
  /** Short name of the ink */
  name: string;
  /** ISO date string when the ink was scanned */
  scanned: string;
  /** Full name of the ink including maker and color name */
  fullname: string;
  /** Manufacturer/brand name */
  maker: string;
}

/**
 * Ink color data with optional distance for similarity calculations
 * @public
 */
export interface InkWithDistance extends InkColor {
  /** Color distance value for similarity calculations (lower = more similar) */
  distance?: number;
}

/**
 * Complete search result with ink data, metadata, and links
 * @public
 */
export interface SearchResult {
  /** Core ink color information */
  ink: InkColor;
  /** Optional search metadata */
  metadata?: InkSearchData;
  /** Optional color distance for similarity searches */
  distance?: number;
  /** URL to detailed ink page on wilderwrites.ink */
  url?: string;
  /** URL to ink image on wilderwrites.ink */
  image_url?: string;
}

/**
 * Color analysis result with closest inks and descriptions
 * @public
 */
export interface ColorAnalysis {
  /** Original hex color string */
  hex: string;
  /** RGB color values [R, G, B] with values 0-255 */
  rgb: [number, number, number];
  /** Array of closest matching inks */
  closest_inks: SearchResult[];
  /** Color family classification (e.g., "red", "blue", "green") */
  color_family: string;
  /** Human-readable color description */
  description: string;
}

/**
 * Color palette result with themed ink recommendations
 * @public
 */
export interface PaletteResult {
  /** Theme name or description */
  theme: string;
  /** Array of recommended inks matching the theme */
  inks: SearchResult[];
  /** Description of the palette */
  description: string;
}
