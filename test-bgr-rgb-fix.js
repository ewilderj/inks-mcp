#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import the compiled utilities
import { 
  hexToRgb, 
  bgrToRgb, 
  rgbToHex, 
  findClosestInks, 
  getColorFamily, 
  getColorDescription,
  createSearchResult 
} from './dist/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing BGR→RGB Conversion Fix\n');

// Load the raw data (still in BGR format)
const rawInkColors = JSON.parse(readFileSync(join(__dirname, 'data/ink-colors.json'), 'utf8'));
const searchData = JSON.parse(readFileSync(join(__dirname, 'data/search.json'), 'utf8'));

// Simulate the server's data loading (convert BGR to RGB)
const inkColors = rawInkColors.map((ink) => ({
  ...ink,
  rgb: bgrToRgb(ink.rgb) // Convert BGR to RGB at load time
}));

console.log(`📊 Loaded ${inkColors.length} inks (BGR→RGB converted)\n`);

// Test 1: Find a known ink and verify its color conversion
console.log('🔍 Test 1: Color Conversion Verification');
console.log('==========================================');

// Find Troublemaker Blueberry (should be blue)
const blueberry = inkColors.find(ink => ink.ink_id === 'troublemaker-blueberry');
if (blueberry) {
  const originalBgr = rawInkColors.find(ink => ink.ink_id === 'troublemaker-blueberry').rgb;
  console.log(`Troublemaker Blueberry:`);
  console.log(`  Original BGR: [${originalBgr.join(', ')}]`);
  console.log(`  Converted RGB: [${blueberry.rgb.join(', ')}]`);
  console.log(`  Hex: ${rgbToHex(blueberry.rgb)}`);
  console.log(`  Color Family: ${getColorFamily(blueberry.rgb)}`);
  console.log(`  Description: ${getColorDescription(blueberry.rgb)}`);
} else {
  console.log('❌ Troublemaker Blueberry not found');
}

// Test a yellow ink
const yellowInk = inkColors.find(ink => ink.fullname.toLowerCase().includes('yellow'));
if (yellowInk) {
  const originalBgr = rawInkColors.find(ink => ink.ink_id === yellowInk.ink_id).rgb;
  console.log(`\n${yellowInk.fullname}:`);
  console.log(`  Original BGR: [${originalBgr.join(', ')}]`);
  console.log(`  Converted RGB: [${yellowInk.rgb.join(', ')}]`);
  console.log(`  Hex: ${rgbToHex(yellowInk.rgb)}`);
  console.log(`  Color Family: ${getColorFamily(yellowInk.rgb)}`);
  console.log(`  Description: ${getColorDescription(yellowInk.rgb)}`);
}

console.log('\n🎯 Test 2: Color Similarity Search');
console.log('==================================');

// Test color similarity for pure blue
const pureBlue = [0, 0, 255]; // Pure blue RGB
const blueMatches = findClosestInks(pureBlue, inkColors, 5);

console.log(`Top 5 inks closest to pure blue RGB(0, 0, 255):`);
blueMatches.forEach((ink, index) => {
  console.log(`  ${index + 1}. ${ink.fullname}`);
  console.log(`     RGB: [${ink.rgb.join(', ')}]`);
  console.log(`     Distance: ${ink.distance?.toFixed(1)}`);
  console.log(`     Color Family: ${getColorFamily(ink.rgb)}`);
});

console.log('\n🟡 Test 3: Yellow Color Search');
console.log('===============================');

// Test color similarity for yellow
const brightYellow = [255, 255, 0]; // Pure yellow RGB
const yellowMatches = findClosestInks(brightYellow, inkColors, 5);

console.log(`Top 5 inks closest to bright yellow RGB(255, 255, 0):`);
yellowMatches.forEach((ink, index) => {
  console.log(`  ${index + 1}. ${ink.fullname}`);
  console.log(`     RGB: [${ink.rgb.join(', ')}]`);
  console.log(`     Distance: ${ink.distance?.toFixed(1)}`);
  console.log(`     Color Family: ${getColorFamily(ink.rgb)}`);
});

console.log('\n🔴 Test 4: Red Color Search');
console.log('============================');

// Test color similarity for red
const brightRed = [255, 0, 0]; // Pure red RGB
const redMatches = findClosestInks(brightRed, inkColors, 5);

console.log(`Top 5 inks closest to bright red RGB(255, 0, 0):`);
redMatches.forEach((ink, index) => {
  console.log(`  ${index + 1}. ${ink.fullname}`);
  console.log(`     RGB: [${ink.rgb.join(', ')}]`);
  console.log(`     Distance: ${ink.distance?.toFixed(1)}`);
  console.log(`     Color Family: ${getColorFamily(ink.rgb)}`);
});

console.log('\n🧮 Test 5: Hex Conversion Verification');
console.log('=======================================');

// Test hex conversion roundtrip
const testColors = [
  { name: 'Pure Red', rgb: [255, 0, 0] },
  { name: 'Pure Green', rgb: [0, 255, 0] },
  { name: 'Pure Blue', rgb: [0, 0, 255] },
  { name: 'Yellow', rgb: [255, 255, 0] },
  { name: 'Magenta', rgb: [255, 0, 255] },
  { name: 'Cyan', rgb: [0, 255, 255] }
];

testColors.forEach(color => {
  const hex = rgbToHex(color.rgb);
  const backToRgb = hexToRgb(hex);
  const matches = JSON.stringify(color.rgb) === JSON.stringify(backToRgb);
  console.log(`${color.name}: RGB${JSON.stringify(color.rgb)} → ${hex} → RGB${JSON.stringify(backToRgb)} ${matches ? '✅' : '❌'}`);
});

console.log('\n📈 Test 6: Color Family Classification');
console.log('======================================');

// Test color family classification with known colors
const knownColors = [
  { name: 'Red', rgb: [200, 50, 50] },
  { name: 'Green', rgb: [50, 200, 50] },
  { name: 'Blue', rgb: [50, 50, 200] },
  { name: 'Yellow', rgb: [200, 200, 50] },
  { name: 'Purple', rgb: [150, 50, 150] },
  { name: 'Orange', rgb: [200, 100, 50] },
  { name: 'Gray', rgb: [128, 128, 128] }
];

knownColors.forEach(color => {
  const family = getColorFamily(color.rgb);
  const description = getColorDescription(color.rgb);
  console.log(`${color.name.padEnd(8)} RGB${JSON.stringify(color.rgb)} → Family: ${family.padEnd(12)} Description: ${description}`);
});

console.log('\n✅ BGR→RGB Conversion Test Complete!');
console.log('\nIf this test shows:');
console.log('- Blue inks for blue searches');
console.log('- Yellow inks for yellow searches'); 
console.log('- Red inks for red searches');
console.log('- Correct hex conversions');
console.log('- Appropriate color family classifications');
console.log('\nThen the BGR→RGB fix is working correctly! 🎉');
