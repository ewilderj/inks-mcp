#!/usr/bin/env node

// Test the color family fix for subtle blue colors like Sabimidori

import { getColorFamily, getColorDescription } from './dist/utils.js';

console.log('🎨 Testing Color Family Detection Fix\n');

const testColors = [
  { name: 'Sabimidori-like', rgb: [93, 93, 118], expected: 'blue' },
  { name: 'True Gray', rgb: [100, 100, 100], expected: 'gray' },
  { name: 'Subtle Blue 1', rgb: [80, 85, 105], expected: 'blue' },
  { name: 'Subtle Blue 2', rgb: [70, 75, 95], expected: 'blue' },
  { name: 'Subtle Green', rgb: [85, 95, 80], expected: 'green' },
  { name: 'Subtle Red', rgb: [95, 80, 85], expected: 'red' },
  { name: 'Near Gray Blue', rgb: [90, 92, 100], expected: 'blue' },
  { name: 'Very Muted Gray', rgb: [120, 118, 122], expected: 'gray' }
];

console.log('Color Family Classification Test:');
console.log('================================');

testColors.forEach(test => {
  const family = getColorFamily(test.rgb);
  const description = getColorDescription(test.rgb);
  const correct = family === test.expected;
  
  console.log(`${test.name.padEnd(18)} RGB(${test.rgb.join(', ').padEnd(11)}) → ${family.padEnd(12)} ${correct ? '✅' : '❌'} (expected: ${test.expected})`);
  console.log(`${' '.repeat(20)} Description: ${description}`);
});

console.log('\nKey improvements:');
console.log('- Moved gray detection to the end');
console.log('- Reduced thresholds for primary color detection (20→10)');
console.log('- Made gray detection much more strict');
console.log('- Added better handling for subtle color differences');
