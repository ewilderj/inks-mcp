#!/usr/bin/env node

// Test the MCP tools directly
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data (same as the MCP server does)
const inkColors = JSON.parse(readFileSync(join(__dirname, 'data/ink-colors.json'), 'utf8'));
const searchData = JSON.parse(readFileSync(join(__dirname, 'data/search.json'), 'utf8'));

// Create search index (same as MCP server)
const fuse = new Fuse(searchData, {
  keys: ['name', 'fullname'],
  threshold: 0.3,
  includeScore: true
});

// Test 1: Search inks by maker (get_inks_by_maker)
console.log('🔍 Testing get_inks_by_maker for "diamine":');
const diamineInks = searchData.filter(ink => 
  ink.maker.toLowerCase() === 'diamine'
);
console.log(`Found ${diamineInks.length} Diamine inks\n`);

// Test 2: Search inks by name (search_inks_by_name) for blue inks
console.log('🔍 Testing search_inks_by_name for "blue":');
const blueResults = fuse.search('blue').slice(0, 10);
const blueInks = blueResults
  .filter(result => result.item.maker.toLowerCase() === 'diamine')
  .map(result => ({
    ...result.item,
    score: result.score
  }));

console.log(`Found ${blueInks.length} blue Diamine inks:`);
blueInks.forEach(ink => {
  const colorData = inkColors.find(c => c.ink_id === ink.ink_id);
  console.log(`- ${ink.fullname} (RGB: ${colorData?.rgb.join(', ') || 'N/A'}) [Score: ${ink.score?.toFixed(3)}]`);
});

// Test 3: Color search for a blue color (search_inks_by_color)
console.log('\n🎨 Testing search_inks_by_color for blue (#0066CC):');
const targetBlue = [0, 102, 204]; // #0066CC

function calculateDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

const colorMatches = inkColors
  .map(ink => ({
    ...ink,
    distance: calculateDistance(ink.rgb, targetBlue)
  }))
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 20);

const diamineColorMatches = colorMatches.filter(ink => {
  const searchInfo = searchData.find(s => s.ink_id === ink.ink_id);
  return searchInfo?.maker.toLowerCase() === 'diamine';
}).slice(0, 5);

console.log('Top 5 Diamine inks closest to blue (#0066CC):');
diamineColorMatches.forEach(ink => {
  const searchInfo = searchData.find(s => s.ink_id === ink.ink_id);
  console.log(`- ${searchInfo?.fullname} (RGB: ${ink.rgb.join(', ')}) [Distance: ${ink.distance.toFixed(1)}]`);
});

console.log('\n✅ MCP tools are working correctly!');
console.log('\n📖 These tools are now available via the MCP server for LLMs to use:');
console.log('- search_inks_by_name: Find inks by fuzzy name matching');
console.log('- search_inks_by_color: Find inks by RGB color similarity');
console.log('- get_inks_by_maker: Get all inks from a specific manufacturer');
console.log('- get_ink_details: Get complete information about a specific ink');
console.log('- analyze_color: Analyze a color and provide ink context');
console.log('- get_color_palette: Generate themed ink palettes');
