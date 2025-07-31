import type { InkColor, InkSearchData, InkWithDistance, SearchResult } from './types.js';

/**
 * Convert hex color string to RGB array
 * @public
 * @param hex - Hex color string (with or without # prefix, e.g., "#FF5733" or "FF5733")
 * @returns RGB array with values 0-255 [R, G, B]
 * @throws Error if hex string is invalid format
 * @example
 * ```typescript
 * hexToRgb("#FF5733") // returns [255, 87, 51]
 * hexToRgb("00FF00") // returns [0, 255, 0]
 * ```
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length !== 6) {
    throw new Error('Invalid hex color string');
  }

  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return [r, g, b];
}

/**
 * Convert BGR array (as stored in ink-colors.json) to RGB array
 * Used at data load time to convert the source BGR data to RGB format
 * @param bgr - BGR array [B, G, R] with values 0-255
 * @returns RGB array [R, G, B] with values 0-255
 * @example
 * ```typescript
 * bgrToRgb([51, 87, 255]) // returns [255, 87, 51]
 * ```
 */
export function bgrToRgb(bgr: [number, number, number]): [number, number, number] {
  const [b, g, r] = bgr;
  return [r, g, b];
}

/**
 * Convert RGB array to BGR array (for comparison with ink data)
 * @deprecated No longer needed - data is converted at load time
 */
export function rgbToBgr(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  return [b, g, r];
}

/**
 * Convert RGB array to hex string
 * @public
 * @param rgb - RGB array [R, G, B] with values 0-255
 * @returns Hex color string with # prefix (e.g., "#FF5733")
 * @example
 * ```typescript
 * rgbToHex([255, 87, 51]) // returns "#FF5733"
 * rgbToHex([0, 255, 0]) // returns "#00FF00"
 * ```
 */
export function rgbToHex(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Calculate Euclidean distance between two RGB colors
 * Uses the standard RGB distance formula: sqrt((r1-r2)² + (g1-g2)² + (b1-b2)²)
 * @public
 * @param rgb1 - First RGB color [R, G, B] with values 0-255
 * @param rgb2 - Second RGB color [R, G, B] with values 0-255
 * @returns Distance value (0 = identical colors, ~441 = maximum distance)
 * @example
 * ```typescript
 * calculateColorDistance([255, 0, 0], [255, 0, 0]) // returns 0 (identical)
 * calculateColorDistance([255, 0, 0], [0, 255, 0]) // returns ~360.6
 * ```
 */
export function calculateColorDistance(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;

  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

/**
 * Find inks closest to a given target color
 * Sorts all inks by color distance and returns the closest matches
 * @public
 * @param targetRgb - Target RGB color [R, G, B] with values 0-255
 * @param inkColors - Array of ink color objects to search through
 * @param maxResults - Maximum number of results to return (default: 20)
 * @returns Array of inks with distance values, sorted by closest first
 * @example
 * ```typescript
 * const closest = findClosestInks([255, 0, 0], inkColors, 5);
 * // Returns 5 inks closest to red, each with a distance property
 * ```
 */
export function findClosestInks(
  targetRgb: [number, number, number],
  inkColors: InkColor[],
  maxResults: number = 20,
): InkWithDistance[] {
  const distances = inkColors.map((ink) => ({
    ...ink,
    distance: calculateColorDistance(targetRgb, ink.rgb), // Now both are RGB!
  }));

  // Sort by distance (closest first)
  distances.sort((a, b) => a.distance - b.distance);

  return distances.slice(0, maxResults);
}

/**
 * Determine color family based on RGB values
 * Analyzes RGB components to classify color into families like "red", "blue", "green", etc.
 * @public
 * @param rgb - RGB color [R, G, B] with values 0-255
 * @returns Color family string (e.g., "red", "blue", "green", "yellow", "purple", "orange", "gray", "mixed")
 * @example
 * ```typescript
 * getColorFamily([255, 0, 0]) // returns "red"
 * getColorFamily([128, 128, 128]) // returns "gray"
 * getColorFamily([255, 165, 0]) // returns "orange"
 * ```
 */
export function getColorFamily(rgb: [number, number, number]): string {
  const [r, g, b] = rgb; // No conversion needed!

  // Determine dominant color component
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Check for grayscale - tightened threshold from 30 to 22
  if (max - min < 22) {
    return 'gray';
  }

  // Check for primary colors
  if (r === max && r > g + 20 && r > b + 20) {
    return 'red';
  }
  if (g === max && g > r + 20 && g > b + 20) {
    return 'green';
  }
  if (b === max && b > r + 20 && b > g + 20) {
    return 'blue';
  }

  // Check for secondary colors
  if (r > 150 && g > 150 && b < 100) {
    return 'yellow';
  }
  if (r > 150 && b > 150 && g < 100) {
    return 'magenta';
  }
  if (g > 150 && b > 150 && r < 100) {
    return 'cyan';
  }

  // More nuanced color detection
  if (r > g && r > b) {
    if (g > b + 30) return 'orange';
    if (b > g + 30) return 'purple';
    return 'red';
  }

  if (g > r && g > b) {
    if (b > r + 30) return 'teal';
    if (r > b + 30) return 'yellow-green';
    return 'green';
  }

  if (b > r && b > g) {
    if (r > g + 30) return 'purple';
    if (g > r + 30) return 'blue-green';
    return 'blue';
  }

  return 'mixed';
}

/**
 * Generate a descriptive color description based on RGB values
 * Combines brightness, saturation, and color family into a human-readable description
 * @public
 * @param rgb - RGB color [R, G, B] with values 0-255
 * @returns Descriptive string (e.g., "dark vibrant red", "light muted blue", "bright yellow")
 * @example
 * ```typescript
 * getColorDescription([255, 0, 0]) // returns "vibrant red"
 * getColorDescription([64, 64, 64]) // returns "dark gray"
 * getColorDescription([255, 200, 200]) // returns "light red"
 * ```
 */
export function getColorDescription(rgb: [number, number, number]): string {
  const [r, g, b] = rgb; // No conversion needed!
  const brightness = (r + g + b) / 3;
  const colorFamily = getColorFamily(rgb);

  let brightnessDesc = '';
  if (brightness < 85) brightnessDesc = 'dark ';
  else if (brightness > 170) brightnessDesc = 'light ';

  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  let saturationDesc = '';
  if (saturation < 30) saturationDesc = 'muted ';
  else if (saturation > 150) saturationDesc = 'vibrant ';

  return `${brightnessDesc}${saturationDesc}${colorFamily}`.trim();
}

/**
 * Convert RGB color to HSL color space
 * @public
 * @param rgb - RGB color [R, G, B] with values 0-255
 * @returns HSL array [H, S, L] where H is 0-360 degrees, S and L are 0-1
 * @example
 * ```typescript
 * rgbToHsl([255, 0, 0]) // returns [0, 1, 0.5] (pure red)
 * rgbToHsl([128, 128, 128]) // returns [0, 0, 0.5] (gray)
 * ```
 */
export function rgbToHsl(rgb: [number, number, number]): [number, number, number] {
  const [rRaw, gRaw, bRaw] = rgb;
  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  // eslint-disable-next-line prefer-const
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

/**
 * Convert HSL color to RGB color space
 * @public
 * @param hsl - HSL color [H, S, L] where H is 0-360 degrees, S and L are 0-1
 * @returns RGB array [R, G, B] with values 0-255
 * @example
 * ```typescript
 * hslToRgb([0, 1, 0.5]) // returns [255, 0, 0] (pure red)
 * hslToRgb([120, 1, 0.5]) // returns [0, 255, 0] (pure green)
 * ```
 */
export function hslToRgb(hsl: [number, number, number]): [number, number, number] {
  // eslint-disable-next-line prefer-const 
  let [h, s, l] = hsl;
  h /= 360;
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Generate a set of harmony colors from a base color using color theory
 * @public
 * @param baseHsl - Base HSL color [H, S, L] where H is 0-360 degrees, S and L are 0-1
 * @param harmony - Color harmony rule to apply
 * @returns Array of HSL colors following the specified harmony rule
 * @example
 * ```typescript
 * // Generate complementary colors (opposite on color wheel)
 * generateHarmonyColors([0, 1, 0.5], 'complementary') // red + cyan
 * 
 * // Generate triadic colors (120° apart)
 * generateHarmonyColors([0, 1, 0.5], 'triadic') // red + green + blue
 * ```
 */
export function generateHarmonyColors(
  baseHsl: [number, number, number],
  harmony: 'complementary' | 'analogous' | 'triadic' | 'split-complementary',
): [number, number, number][] {
  const [h, s, l] = baseHsl;
  const harmonyHues: { [key: string]: number[] } = {
    complementary: [h, (h + 180) % 360],
    analogous: [h, (h + 30) % 360, (h + 330) % 360],
    triadic: [h, (h + 120) % 360, (h + 240) % 360],
    'split-complementary': [h, (h + 150) % 360, (h + 210) % 360],
  };

  const hues = harmonyHues[harmony] || [h];
  return hues.map((hue) => [hue, s, l]);
}

/**
 * Create a SearchResult object from ink data and optional metadata
 * Builds a complete search result with URLs for ink details and images
 * @public
 * @param ink - Ink color data
 * @param metadata - Optional search metadata (maker, scan date, etc.)
 * @param distance - Optional color distance value for similarity searches
 * @returns Complete SearchResult object with URLs to ink details and images
 * @example
 * ```typescript
 * const result = createSearchResult(inkColor, metadata, 15.2);
 * // Returns object with ink data, metadata, distance, and wilderwrites.ink URLs
 * ```
 */
export function createSearchResult(
  ink: InkColor,
  metadata?: InkSearchData,
  distance?: number,
): SearchResult {
  return {
    ink,
    metadata,
    distance,
    url: `https://wilderwrites.ink/ink/${ink.ink_id}`,
    image_url: `https://wilderwrites.ink/images/inks/${ink.ink_id}-sq.jpg`,
  };
}
