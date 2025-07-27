#!/usr/bin/env node

// Test corrected blue Diamine ink search
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { bgrToRgb } from './dist/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data
const inkColors = JSON.parse(readFileSync(join(__dirname, 'data/ink-colors.json'), 'utf8'));
const searchData = JSON.parse(readFileSync(join(__dirname, 'data/search.json'), 'utf8'));

console.log('🔍 Finding ACTUAL blue Diamine inks (with BGR correction):\n');

// Find Diamine inks
const diamineInks = searchData.filter(ink => 
  ink.maker.toLowerCase() === 'diamine'
);

console.log(`Found ${diamineInks.length} Diamine inks total\n`);

// Find blue inks by RGB color analysis (corrected)
const blueInks = [];
diamineInks.forEach(ink => {
  const colorData = inkColors.find(c => c.ink_id === ink.ink_id);
  if (colorData) {
    const correctedRgb = bgrToRgb(colorData.rgb); // Convert BGR to RGB
    const [r, g, b] = correctedRgb;
    
    // Blue detection: blue component should be highest and significant
    if (b > r && b > g && b > 100) {
      blueInks.push({
        ...ink,
        rgb: correctedRgb,
        bgr: colorData.rgb,
        blueAmount: b,
        dominance: b - Math.max(r, g)
      });
    }
  }
});

// Sort by blue dominance
blueInks.sort((a, b) => b.dominance - a.dominance);

console.log(`🔵 Blue Diamine inks (${blueInks.length} found, sorted by blue dominance):`);
blueInks.forEach(ink => {
  const hex = '#' + ink.rgb.map(c => c.toString(16).padStart(2, '0')).join('');
  console.log(`- ${ink.fullname}`);
  console.log(`  RGB: [${ink.rgb.join(', ')}] | Hex: ${hex}`);
  console.log(`  Blue level: ${ink.blueAmount}, Dominance: +${ink.dominance}`);
  console.log('');
});

// Also check inks with "blue" in the name
console.log('📝 Diamine inks with "blue" in the name:');
const nameBlueInks = diamineInks.filter(ink => 
  ink.fullname.toLowerCase().includes('blue') || 
  ink.name.toLowerCase().includes('blue')
);

nameBlueInks.forEach(ink => {
  const colorData = inkColors.find(c => c.ink_id === ink.ink_id);
  if (colorData) {
    const correctedRgb = bgrToRgb(colorData.rgb);
    const hex = '#' + correctedRgb.map(c => c.toString(16).padStart(2, '0')).join('');
    console.log(`- ${ink.fullname}: RGB [${correctedRgb.join(', ')}] | ${hex}`);
  }
});
