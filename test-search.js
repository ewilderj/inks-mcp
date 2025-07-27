#!/usr/bin/env node

// Test script to find Diamine blue inks
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the ink data directly to simulate what we should find
const inkColors = JSON.parse(readFileSync(join(__dirname, 'data/ink-colors.json'), 'utf8'));
const searchData = JSON.parse(readFileSync(join(__dirname, 'data/search.json'), 'utf8'));

// Find Diamine inks
const diamineInks = searchData.filter(ink => 
  ink.maker.toLowerCase() === 'diamine'
);

console.log(`Found ${diamineInks.length} Diamine inks total`);

// Find blue-ish Diamine inks by looking for "blue" in the name
const blueInks = diamineInks.filter(ink => 
  ink.fullname.toLowerCase().includes('blue') || 
  ink.name.toLowerCase().includes('blue')
);

console.log(`\nBlue Diamine inks (${blueInks.length} found):`);
blueInks.forEach(ink => {
  const colorData = inkColors.find(c => c.ink_id === ink.ink_id);
  if (colorData) {
    console.log(`- ${ink.fullname} (RGB: ${colorData.rgb.join(', ')})`);
  }
});

// Also find inks that are blue by RGB color analysis
console.log('\nDiamine inks with blue-ish RGB values:');
let blueishCount = 0;
diamineInks.forEach(ink => {
  const colorData = inkColors.find(c => c.ink_id === ink.ink_id);
  if (colorData) {
    const [r, g, b] = colorData.rgb;
    // Simple blue detection: blue component should be highest
    if (b > r && b > g && b > 100) {
      console.log(`- ${ink.fullname} (RGB: ${colorData.rgb.join(', ')})`);
      blueishCount++;
    }
  }
});
console.log(`\nTotal blue-ish Diamine inks by RGB analysis: ${blueishCount}`);
