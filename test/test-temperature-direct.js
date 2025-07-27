#!/usr/bin/env node

// Direct Test for Temperature Analysis Functions
// Tests the new temperature functions in isolation

import {
  calculateColorTemperature,
  getTemperatureCategory,
  getTemperatureDescription,
  getColorFamilyTemperatureBias,
  hexToRgb,
  getColorFamily
} from '../dist/utils.js';

console.log('🌡️  Testing Color Temperature Analysis Functions\n');

// Test cases with expected temperature characteristics
const testCases = [
  {
    name: 'Warm Red',
    color: '#FF4500', // OrangeRed
    expectedCategory: 'warm',
    expectedRange: [2500, 3500] // Expected temperature range
  },
  {
    name: 'Cool Blue', 
    color: '#4682B4', // SteelBlue
    expectedCategory: 'cool',
    expectedRange: [5000, 7000]
  },
  {
    name: 'Neutral Gray',
    color: '#808080', // Gray
    expectedCategory: 'neutral',
    expectedRange: [3500, 5000]
  },
  {
    name: 'Golden Yellow',
    color: '#FFD700', // Gold
    expectedCategory: 'warm',
    expectedRange: [2500, 3800]
  },
  {
    name: 'Deep Blue',
    color: '#000080', // Navy
    expectedCategory: 'cool',
    expectedRange: [5500, 8000]
  }
];

function testTemperatureCalculation() {
  console.log('🔥 Testing calculateColorTemperature()');
  console.log('='.repeat(40));
  
  let passed = 0;
  const total = testCases.length;
  
  testCases.forEach(testCase => {
    try {
      const rgb = hexToRgb(testCase.color);
      const temperature = calculateColorTemperature(rgb);
      const category = getTemperatureCategory(temperature);
      const description = getTemperatureDescription(rgb);
      const colorFamily = getColorFamily(rgb);
      const biasedTemp = getColorFamilyTemperatureBias(colorFamily, rgb);
      
      console.log(`\n📊 ${testCase.name} (${testCase.color})`);
      console.log(`   RGB: [${rgb.join(', ')}]`);
      console.log(`   Temperature: ${temperature}K`);
      console.log(`   Category: ${category}`);
      console.log(`   Description: ${description}`);
      console.log(`   Color Family: ${colorFamily}`);
      console.log(`   Biased Temperature: ${biasedTemp}K`);
      
      // Validate temperature range
      const [minTemp, maxTemp] = testCase.expectedRange;
      const tempInRange = temperature >= minTemp && temperature <= maxTemp;
      
      // Validate category
      const categoryMatch = category === testCase.expectedCategory;
      
      if (tempInRange && categoryMatch) {
        console.log('   ✅ PASSED');
        passed++;
      } else {
        console.log('   ❌ FAILED');
        if (!tempInRange) {
          console.log(`      Expected temperature: ${minTemp}-${maxTemp}K, got: ${temperature}K`);
        }
        if (!categoryMatch) {
          console.log(`      Expected category: ${testCase.expectedCategory}, got: ${category}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  });
  
  console.log('\n' + '='.repeat(40));
  console.log(`📈 Temperature Calculation Tests: ${passed}/${total} passed`);
  return passed === total;
}

function testTemperatureEdgeCases() {
  console.log('\n🔍 Testing Edge Cases');
  console.log('='.repeat(40));
  
  const edgeCases = [
    { name: 'Pure Black', color: '#000000' },
    { name: 'Pure White', color: '#FFFFFF' },
    { name: 'Pure Red', color: '#FF0000' },
    { name: 'Pure Green', color: '#00FF00' },
    { name: 'Pure Blue', color: '#0000FF' },
  ];
  
  let passed = 0;
  
  edgeCases.forEach(testCase => {
    try {
      const rgb = hexToRgb(testCase.color);
      const temperature = calculateColorTemperature(rgb);
      const category = getTemperatureCategory(temperature);
      
      console.log(`\n📊 ${testCase.name} (${testCase.color})`);
      console.log(`   Temperature: ${temperature}K`);
      console.log(`   Category: ${category}`);
      
      // Basic validation - temperature should be in valid range
      if (temperature >= 2000 && temperature <= 8000) {
        console.log('   ✅ Valid temperature range');
        passed++;
      } else {
        console.log(`   ❌ Invalid temperature: ${temperature}K (expected 2000-8000K)`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  });
  
  console.log('\n' + '='.repeat(40));
  console.log(`🔍 Edge Case Tests: ${passed}/${edgeCases.length} passed`);
  return passed === edgeCases.length;
}

function testTemperatureDescriptions() {
  console.log('\n📝 Testing Temperature Descriptions');
  console.log('='.repeat(40));
  
  const colors = ['#FF4500', '#4682B4', '#808080', '#FFD700'];
  let passed = 0;
  
  colors.forEach(color => {
    try {
      const rgb = hexToRgb(color);
      const description = getTemperatureDescription(rgb);
      
      console.log(`${color}: "${description}"`);
      
      // Basic validation - description should contain key words
      if (description.includes('warm') || description.includes('cool') || description.includes('neutral')) {
        passed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR for ${color}: ${error.message}`);
    }
  });
  
  console.log(`\n📝 Description Tests: ${passed}/${colors.length} passed`);
  return passed === colors.length;
}

// Run all tests
async function runAllTests() {
  const test1 = testTemperatureCalculation();
  const test2 = testTemperatureEdgeCases();
  const test3 = testTemperatureDescriptions();
  
  const totalPassed = [test1, test2, test3].filter(Boolean).length;
  const totalTests = 3;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Overall Result: ${totalPassed}/${totalTests} test suites passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All temperature analysis tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed.');
    process.exit(1);
  }
}

runAllTests().catch(console.error);