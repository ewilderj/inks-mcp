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
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: [number, number, number]): [number, number, number] {
  let [r, g, b] = rgb;
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: [number, number, number]): [number, number, number] {
  let [h, s, l] = hsl;
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Generate a set of harmony colors from a base color
 */
export function generateHarmonyColors(
  baseHsl: [number, number, number],
  harmony: 'complementary' | 'analogous' | 'triadic' | 'split-complementary'
): [number, number, number][] {
  const [h, s, l] = baseHsl;
  const harmonyHues: { [key: string]: number[] } = {
    complementary: [h, (h + 180) % 360],
    analogous: [h, (h + 30) % 360, (h + 330) % 360],
    triadic: [h, (h + 120) % 360, (h + 240) % 360],
    'split-complementary': [h, (h + 150) % 360, (h + 210) % 360],
  };

  const hues = harmonyHues[harmony] || [h];
  return hues.map(hue => [hue, s, l]);
}

/**
 * Calculate color temperature based on RGB values
 * Returns temperature in Kelvin (approximate)
 * Uses a modified CCT calculation with hue-based adjustments
 */
export function calculateColorTemperature(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  
  // Handle grayscale colors
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 15) { // Very low saturation = neutral
    const brightness = (r + g + b) / 3;
    // Darker grays appear slightly warmer, lighter grays slightly cooler
    return 4250 + (brightness - 127.5) * 3;
  }
  
  // Get HSL for hue-based calculation
  const hsl = rgbToHsl(rgb);
  const hue = hsl[0];
  const saturation = hsl[1];
  const lightness = hsl[2];
  
  // Base temperature calculation based on hue position
  let baseTemp;
  if (hue >= 0 && hue < 60) { // Red to Yellow - warm
    baseTemp = 2800 + (hue / 60) * 800; // 2800K to 3600K
  } else if (hue >= 60 && hue < 120) { // Yellow to Green - warming to neutral
    baseTemp = 3600 + ((hue - 60) / 60) * 1200; // 3600K to 4800K
  } else if (hue >= 120 && hue < 180) { // Green to Cyan - neutral to cool
    baseTemp = 4800 + ((hue - 120) / 60) * 1000; // 4800K to 5800K
  } else if (hue >= 180 && hue < 240) { // Cyan to Blue - cool
    baseTemp = 5800 + ((hue - 180) / 60) * 800; // 5800K to 6600K
  } else if (hue >= 240 && hue < 300) { // Blue to Magenta - cool to neutral
    baseTemp = 6600 - ((hue - 240) / 60) * 1600; // 6600K to 5000K
  } else { // Magenta to Red - neutral to warm
    baseTemp = 5000 - ((hue - 300) / 60) * 1200; // 5000K to 3800K
  }
  
  // Saturation adjustment - more saturated colors are more extreme
  const saturationBoost = saturation * 0.5;
  if (baseTemp < 4250) { // Warm colors get warmer with saturation
    baseTemp -= saturationBoost * 800;
  } else { // Cool colors get cooler with saturation
    baseTemp += saturationBoost * 1000;
  }
  
  // Lightness adjustment - darker colors appear warmer
  const lightnessAdjustment = (0.5 - lightness) * 400;
  baseTemp -= lightnessAdjustment;
  
  // Clamp to reasonable range
  return Math.max(2000, Math.min(8000, Math.round(baseTemp)));
}

/**
 * Classify temperature as warm/cool/neutral
 */
export function getTemperatureCategory(tempKelvin: number): 'warm' | 'cool' | 'neutral' {
  if (tempKelvin < 3500) return 'warm';
  if (tempKelvin > 5000) return 'cool';
  return 'neutral';
}

/**
 * Get temperature description with intensity
 */
export function getTemperatureDescription(rgb: [number, number, number]): string {
  const tempKelvin = calculateColorTemperature(rgb);
  const category = getTemperatureCategory(tempKelvin);
  const colorFamily = getColorFamily(rgb);
  
  let intensity = '';
  if (category === 'warm') {
    if (tempKelvin < 2800) intensity = 'very ';
    else if (tempKelvin > 3300) intensity = 'slightly ';
  } else if (category === 'cool') {
    if (tempKelvin > 6500) intensity = 'very ';
    else if (tempKelvin < 5500) intensity = 'slightly ';
  }
  
  const familyDescriptor = getColorFamilyTemperatureDescriptor(colorFamily);
  return `${intensity}${category}${familyDescriptor ? ` ${familyDescriptor}` : ''} tone`;
}

/**
 * Calculate temperature bias for specific color families
 */
export function getColorFamilyTemperatureBias(colorFamily: string, rgb: [number, number, number]): number {
  const baseTemp = calculateColorTemperature(rgb);
  
  // Family-specific temperature biases
  const familyBiases: { [key: string]: number } = {
    'red': -300,      // Reds tend to be warmer
    'orange': -500,   // Oranges are very warm
    'yellow': -200,   // Yellows are warm
    'green': 100,     // Greens slightly cool
    'blue': 800,      // Blues are cool
    'purple': 300,    // Purples moderately cool
    'magenta': -100,  // Magentas slightly warm
    'cyan': 600,      // Cyans are cool
    'teal': 400,      // Teals moderately cool
    'gray': 0,        // Grays neutral
  };
  
  const bias = familyBiases[colorFamily] || 0;
  return Math.max(2000, Math.min(8000, baseTemp + bias));
}

/**
 * Get color family-specific temperature descriptor
 */
function getColorFamilyTemperatureDescriptor(colorFamily: string): string {
  const descriptors: { [key: string]: string } = {
    'red': 'fiery',
    'orange': 'golden',
    'yellow': 'sunny',
    'blue': 'icy',
    'purple': 'cool',
    'green': 'fresh',
    'cyan': 'crisp',
    'teal': 'aquatic',
    'magenta': 'vibrant'
  };
  
  return descriptors[colorFamily] || '';
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
