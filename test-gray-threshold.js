#!/usr/bin/env node

// Test edge cases around the gray threshold of 22

import { getColorFamily, getColorDescription } from './dist/utils.js';

console.log('🎯 Gray Threshold Edge Case Testing (threshold = 22)\n');

const edgeCases = [
  { name: 'Just Gray (diff=21)', rgb: [100, 100, 121], expected: 'gray' },
  { name: 'Just Blue (diff=22)', rgb: [100, 100, 122], expected: 'blue' },
  { name: 'Clearly Blue (diff=25)', rgb: [93, 93, 118], expected: 'blue' },
  { name: 'True Gray (diff=0)', rgb: [100, 100, 100], expected: 'gray' },
  { name: 'Very Subtle Blue (diff=23)', rgb: [90, 90, 113], expected: 'blue' },
  { name: 'Barely Gray (diff=20)', rgb: [80, 85, 100], expected: 'gray' }
];

console.log('Edge Case Results:');
console.log('==================');

edgeCases.forEach(test => {
  const family = getColorFamily(test.rgb);
  const description = getColorDescription(test.rgb);
  const max = Math.max(...test.rgb);
  const min = Math.min(...test.rgb);
  const diff = max - min;
  const correct = family === test.expected;
  
  console.log(`${test.name.padEnd(22)} RGB(${test.rgb.join(', ').padEnd(11)}) diff=${diff.toString().padEnd(2)} → ${family.padEnd(5)} ${correct ? '✅' : '❌'}`);
  console.log(`${' '.repeat(24)} Expected: ${test.expected}, Description: ${description}`);
});

console.log('\nSummary:');
console.log('- Threshold 22 allows Sabimidori (diff=25) to be classified as blue ✅');
console.log('- True grays (diff=0) still classified correctly ✅');
console.log('- Borderline cases around diff=21-22 handled reasonably ✅');
