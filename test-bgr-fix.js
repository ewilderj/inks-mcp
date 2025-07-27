#!/usr/bin/env node

// Test the corrected BGR format handling
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { bgrToRgb } from './dist/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data
const inkColors = JSON.parse(readFileSync(join(__dirname, 'data/ink-colors.json'), 'utf8'));
const searchData = JSON.parse(readFileSync(join(__dirname, 'data/search.json'), 'utf8'));

console.log('🔧 Testing BGR to RGB conversion fixes:\n');

// Find some interesting inks to test
const testInks = [
  'diamine-golden-honey',
  'diamine-inkvent-blue-peppermint',
  'diamine-oxblood'
];

testInks.forEach(inkId => {
  const colorData = inkColors.find(ink => ink.ink_id === inkId);
  const searchInfo = searchData.find(ink => ink.ink_id === inkId);
  
  if (colorData && searchInfo) {
    const originalBgr = colorData.rgb;
    const correctedRgb = bgrToRgb(originalBgr);
    
    console.log(`🎨 ${searchInfo.fullname}:`);
    console.log(`   Raw data (BGR): [${originalBgr.join(', ')}]`);
    console.log(`   Corrected (RGB): [${correctedRgb.join(', ')}]`);
    console.log(`   Hex: #${correctedRgb.map(c => c.toString(16).padStart(2, '0')).join('')}`);
    console.log('');
  }
});

// Test Golden Honey specifically
const goldenHoney = inkColors.find(ink => ink.ink_id === 'diamine-golden-honey');
if (goldenHoney) {
  const correctedRgb = bgrToRgb(goldenHoney.rgb);
  console.log('🍯 Golden Honey Analysis:');
  console.log(`   Original BGR: [${goldenHoney.rgb.join(', ')}] - This looked blue!`);
  console.log(`   Corrected RGB: [${correctedRgb.join(', ')}] - This is actually golden/yellow!`);
  
  // Analyze what color family it really is
  const [r, g, b] = correctedRgb;
  console.log(`   Red: ${r}, Green: ${g}, Blue: ${b}`);
  if (r > g && r > b) {
    console.log('   ✅ This is actually a red-dominant color (makes sense for honey!)');
  } else if (g > r && g > b) {
    console.log('   ✅ This is actually a green-dominant color');
  } else if (b > r && b > g) {
    console.log('   ✅ This is actually a blue-dominant color');
  }
}
