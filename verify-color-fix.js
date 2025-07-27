#!/usr/bin/env node

// Simple test to verify key color matching functionality after BGR→RGB fix

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
  getColorDescription 
} from './dist/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎯 Quick BGR→RGB Fix Verification\n');

// Load and convert data (simulating server behavior)
const rawInkColors = JSON.parse(readFileSync(join(__dirname, 'data/ink-colors.json'), 'utf8'));
const inkColors = rawInkColors.map((ink) => ({
  ...ink,
  rgb: bgrToRgb(ink.rgb) // Convert BGR to RGB
}));

console.log('✅ Test 1: Troublemaker Blueberry Color Check');
console.log('==============================================');

const blueberry = inkColors.find(ink => ink.ink_id === 'troublemaker-blueberry');
if (blueberry) {
  console.log(`RGB: [${blueberry.rgb.join(', ')}]`);
  console.log(`Hex: ${rgbToHex(blueberry.rgb)}`);
  console.log(`Color Family: ${getColorFamily(blueberry.rgb)}`);
  
  // Check if it's correctly identified as blue
  const isBlue = getColorFamily(blueberry.rgb) === 'blue';
  console.log(`Correctly identified as blue: ${isBlue ? '✅' : '❌'}`);
}

console.log('\n✅ Test 2: Blue Color Search Results');
console.log('====================================');

// Search for inks similar to pure blue
const pureBlue = [0, 0, 255];
const blueResults = findClosestInks(pureBlue, inkColors, 3);

console.log('Top 3 closest to pure blue:');
blueResults.forEach((ink, index) => {
  const family = getColorFamily(ink.rgb);
  const isBlueFamily = family.includes('blue');
  console.log(`${index + 1}. ${ink.fullname}`);
  console.log(`   RGB: [${ink.rgb.join(', ')}]`);
  console.log(`   Family: ${family} ${isBlueFamily ? '✅' : '⚠️'}`);
});

console.log('\n✅ Test 3: Yellow Color Search Results');
console.log('======================================');

// Search for inks similar to bright yellow
const brightYellow = [255, 255, 0];
const yellowResults = findClosestInks(brightYellow, inkColors, 3);

console.log('Top 3 closest to bright yellow:');
yellowResults.forEach((ink, index) => {
  const family = getColorFamily(ink.rgb);
  const isWarmColor = family.includes('yellow') || family.includes('orange') || family.includes('red');
  console.log(`${index + 1}. ${ink.fullname}`);
  console.log(`   RGB: [${ink.rgb.join(', ')}]`);
  console.log(`   Family: ${family} ${isWarmColor ? '✅' : '⚠️'}`);
});

console.log('\n✅ Test 4: Hex Conversion Accuracy');
console.log('==================================');

// Test some known colors
const testCases = [
  { name: 'Pure Red', rgb: [255, 0, 0], expectedHex: '#ff0000' },
  { name: 'Pure Blue', rgb: [0, 0, 255], expectedHex: '#0000ff' },
  { name: 'Pure Green', rgb: [0, 255, 0], expectedHex: '#00ff00' }
];

testCases.forEach(test => {
  const actualHex = rgbToHex(test.rgb);
  const matches = actualHex === test.expectedHex;
  console.log(`${test.name}: ${actualHex} ${matches ? '✅' : '❌'}`);
});

console.log('\n🎉 BGR→RGB Fix Verification Complete!');
console.log('\nKey indicators of success:');
console.log('- Troublemaker Blueberry should be identified as blue family');
console.log('- Blue searches should return blue-family inks');
console.log('- Yellow searches should return warm-color inks'); 
console.log('- Hex conversions should be accurate');
console.log('\nIf all tests show ✅, the fix is working correctly!');
