import { InkColor, InkSearchData, InkWithDistance, SearchResult } from './types.js';

/**
 * Convert hex color to RGB array
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
 */
export function rgbToHex(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Calculate Euclidean distance between two RGB colors
 * Now simplified - both inputs are RGB format
 */
export function calculateColorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + 
    Math.pow(g1 - g2, 2) + 
    Math.pow(b1 - b2, 2)
  );
}

/**
 * Find inks closest to a given color
 * Now simplified - both target and ink colors are RGB
 */
export function findClosestInks(
  targetRgb: [number, number, number], 
  inkColors: InkColor[], 
  maxResults: number = 20
): InkWithDistance[] {
  const distances = inkColors.map(ink => ({
    ...ink,
    distance: calculateColorDistance(targetRgb, ink.rgb) // Now both are RGB!
  }));
  
  // Sort by distance (closest first)
  distances.sort((a, b) => a.distance - b.distance);
  
  return distances.slice(0, maxResults);
}

/**
 * Determine color family based on RGB values
 * Now simplified - input is already RGB format
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
 * Generate a color description based on RGB values
 * Now simplified - input is already RGB format
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
 * Create a SearchResult from ink data
 */
export function createSearchResult(
  ink: InkColor, 
  metadata?: InkSearchData, 
  distance?: number
): SearchResult {
  return {
    ink,
    metadata,
    distance,
    url: `https://wilderwrites.ink/ink/${ink.ink_id}`,
    image_url: `https://wilderwrites.ink/images/inks/${ink.ink_id}-sq.jpg`
  };
}
