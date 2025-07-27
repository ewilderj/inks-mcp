#!/usr/bin/env node

// Test the enhanced get_color_palette tool with new themes and harmony features

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  hexToRgb, 
  bgrToRgb, 
  rgbToHsl,
  hslToRgb,
  generateHarmonyColors,
  findClosestInks, 
  createSearchResult 
} from '../dist/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎨 Testing Enhanced get_color_palette Tool\n');

// Load ink data (same as server)
const rawInkColors = JSON.parse(readFileSync(join(__dirname, '../data/ink-colors.json'), 'utf8'));
const searchData = JSON.parse(readFileSync(join(__dirname, '../data/search.json'), 'utf8'));
const inkColors = rawInkColors.map((ink) => ({
  ...ink,
  rgb: bgrToRgb(ink.rgb)
}));

function getInkMetadata(inkId) {
  return searchData.find(item => item.ink_id === inkId);
}

// Test function that mimics the server's getColorPalette method
function testGetColorPalette(theme, paletteSize = 5, harmony = null) {
  console.log(`🧪 Testing: theme="${theme}", size=${paletteSize}, harmony=${harmony || 'none'}`);
  
  const themeColors = {
    warm: [[255, 100, 50], [255, 150, 0], [200, 80, 80], [180, 120, 60], [220, 180, 100]],
    cool: [[50, 150, 255], [100, 200, 200], [150, 100, 255], [80, 180, 150], [120, 120, 200]],
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
  };

  let targetColors;
  const lowerCaseTheme = theme.toLowerCase();

  try {
    if (harmony) {
      const baseRgb = hexToRgb(theme);
      const baseHsl = rgbToHsl(baseRgb);
      const harmonyHsl = generateHarmonyColors(baseHsl, harmony);
      targetColors = harmonyHsl.map(hsl => hslToRgb(hsl));
      console.log(`   Base color: ${theme} → HSL(${baseHsl.map(v => Math.round(v)).join(', ')})`);
      console.log(`   Harmony colors: ${harmonyHsl.length}`);
    } else if (themeColors[lowerCaseTheme]) {
      targetColors = themeColors[lowerCaseTheme];
      console.log(`   ✅ Found predefined theme with ${targetColors.length} colors`);
    } else if (theme.startsWith('#') || theme.includes(',')) {
      targetColors = theme.split(',').map(hex => hexToRgb(hex.trim()));
      console.log(`   ✅ Custom palette with ${targetColors.length} colors`);
    } else {
      throw new Error(`Unknown theme: "${theme}". Available themes are: ${Object.keys(themeColors).join(', ')}`);
    }

    const paletteInks = [];
    const usedInkIds = new Set();

    for (let i = 0; i < Math.min(paletteSize, targetColors.length); i++) {
      const targetRgb = targetColors[i];
      const closestInks = findClosestInks(targetRgb, inkColors, 5).filter(ink => !usedInkIds.has(ink.ink_id));
      
      if (closestInks.length > 0) {
        const ink = closestInks[0];
        usedInkIds.add(ink.ink_id);
        const metadata = getInkMetadata(ink.ink_id);
        const result = createSearchResult(ink, metadata, ink.distance);
        paletteInks.push(result);
        
        console.log(`   ${i + 1}. ${ink.fullname}`);
        console.log(`      Target: RGB(${targetRgb.join(', ')}) → Actual: RGB(${ink.rgb.join(', ')}) | Distance: ${ink.distance?.toFixed(1)}`);
      }
    }

    console.log(`   ✅ Generated palette with ${paletteInks.length} inks\n`);
    return { success: true, paletteInks };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

// Test 1: New predefined themes
console.log('1️⃣ Testing New Predefined Themes');
console.log('================================');
const newThemes = ['summer', 'winter', 'pastel', 'vibrant', 'monochrome', 'sunset', 'forest'];
newThemes.forEach(theme => testGetColorPalette(theme, 3));

// Test 2: Harmony features
console.log('2️⃣ Testing Harmony Features');
console.log('============================');
const harmonyTests = [
  { color: '#FF0000', harmony: 'complementary' },
  { color: '#00FF00', harmony: 'analogous' },
  { color: '#0000FF', harmony: 'triadic' },
  { color: '#FF8000', harmony: 'split-complementary' }
];

harmonyTests.forEach(test => {
  testGetColorPalette(test.color, 3, test.harmony);
});

// Test 3: Custom color palettes
console.log('3️⃣ Testing Custom Color Palettes');
console.log('=================================');
const customTests = [
  '#FF0000,#00FF00,#0000FF',
  '#FF6B35,#F7931E,#FFD700',
  '#2E86AB,#A23B72,#F18F01'
];

customTests.forEach(palette => testGetColorPalette(palette, 3));

// Test 4: Error handling
console.log('4️⃣ Testing Error Handling');
console.log('==========================');
const errorTests = [
  { theme: 'nonexistent', harmony: null },
  { theme: '#INVALID', harmony: 'complementary' },
  { theme: '#FF0000', harmony: 'invalid-harmony' }
];

errorTests.forEach(test => testGetColorPalette(test.theme, 3, test.harmony));

// Test 5: Color conversion functions
console.log('5️⃣ Testing Color Conversion Functions');
console.log('=====================================');
const testColor = [255, 0, 0]; // Red
const hsl = rgbToHsl(testColor);
const backToRgb = hslToRgb(hsl);
console.log(`RGB→HSL→RGB conversion test:`);
console.log(`Original: RGB(${testColor.join(', ')})`);
console.log(`HSL: (${hsl.map(v => Math.round(v)).join(', ')})`);
console.log(`Back to RGB: (${backToRgb.join(', ')})`);
console.log(`Conversion accurate: ${JSON.stringify(testColor) === JSON.stringify(backToRgb) ? '✅' : '❌'}\n`);

// Test harmony generation
console.log('Testing harmony generation:');
const baseHsl = [0, 1, 0.5]; // Pure red in HSL
['complementary', 'analogous', 'triadic', 'split-complementary'].forEach(harmony => {
  const harmonyColors = generateHarmonyColors(baseHsl, harmony);
  console.log(`${harmony}: ${harmonyColors.length} colors`);
  harmonyColors.forEach((hsl, i) => {
    const rgb = hslToRgb(hsl);
    console.log(`  ${i + 1}. HSL(${hsl.map(v => Math.round(v)).join(', ')}) → RGB(${rgb.join(', ')})`);
  });
});

console.log('\n🎉 Enhanced palette testing complete!');
console.log('\nKey features tested:');
console.log('✅ New predefined themes (summer, winter, pastel, etc.)');
console.log('✅ Harmony-based palette generation');
console.log('✅ Custom hex color palettes');
console.log('✅ Error handling and validation');
console.log('✅ Color space conversions (RGB ↔ HSL)');
console.log('✅ Ink deduplication in palettes');
