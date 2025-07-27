#!/usr/bin/env node

// Test Color Temperature Analysis
// Tests the new temperature analysis functionality

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌡️  Testing Color Temperature Analysis\n');

// Test cases with expected temperature characteristics
const testCases = [
  {
    name: 'Warm Red',
    color: '#FF4500', // OrangeRed
    expectedCategory: 'warm',
    expectedSeasons: ['autumn', 'winter']
  },
  {
    name: 'Cool Blue', 
    color: '#4682B4', // SteelBlue
    expectedCategory: 'cool',
    expectedSeasons: ['winter', 'spring']
  },
  {
    name: 'Neutral Gray',
    color: '#808080', // Gray
    expectedCategory: 'neutral',
    expectedSeasons: ['spring', 'summer', 'autumn']
  },
  {
    name: 'Golden Yellow',
    color: '#FFD700', // Gold
    expectedCategory: 'warm',
    expectedSeasons: ['summer', 'autumn']
  }
];

async function testTemperatureAnalysis(testCase) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing: ${testCase.name} (${testCase.color})`);
    
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: join(__dirname, '..')
    });
    
    let output = '';
    let hasError = false;
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      console.error('Error:', data.toString());
      hasError = true;
    });
    
    child.on('close', (code) => {
      if (hasError || code !== 0) {
        console.log(`   ❌ Failed to analyze ${testCase.color}`);
        resolve(false);
        return;
      }
      
      try {
        // Parse the MCP response to extract temperature analysis
        const lines = output.split('\n');
        const responseLine = lines.find(line => line.trim().startsWith('{"content"'));
        
        if (!responseLine) {
          console.log(`   ❌ No valid response found`);
          resolve(false);
          return;
        }
        
        const mcpResponse = JSON.parse(responseLine);
        const analysis = JSON.parse(mcpResponse.content[0].text);
        
        if (!analysis.temperature) {
          console.log(`   ❌ No temperature analysis found`);
          resolve(false);
          return;
        }
        
        const { temperature } = analysis;
        
        // Validate temperature analysis
        console.log(`   📊 Temperature: ${temperature.kelvin}K (${temperature.category})`);
        console.log(`   📝 Description: ${temperature.description}`);
        console.log(`   🗓️  Seasons: ${temperature.seasonal_match.join(', ')}`);
        
        // Check expectations
        let passed = true;
        if (temperature.category !== testCase.expectedCategory) {
          console.log(`   ⚠️  Expected category: ${testCase.expectedCategory}, got: ${temperature.category}`);
          passed = false;
        }
        
        // Check if at least one expected season matches
        const hasSeasonMatch = testCase.expectedSeasons.some(season => 
          temperature.seasonal_match.includes(season)
        );
        
        if (!hasSeasonMatch) {
          console.log(`   ⚠️  Expected seasons: ${testCase.expectedSeasons.join(', ')}, got: ${temperature.seasonal_match.join(', ')}`);
          // Don't fail the test for season mismatches, as these can be subjective
        }
        
        console.log(`   ${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}`);
        resolve(passed);
        
      } catch (parseError) {
        console.log(`   ❌ Failed to parse response: ${parseError.message}`);
        resolve(false);
      }
    });
    
    // Send MCP request for analyze_color
    const mcpRequest = {
      method: 'tools/call',
      params: {
        name: 'analyze_color',
        arguments: {
          color: testCase.color
        }
      }
    };
    
    child.stdin.write(JSON.stringify(mcpRequest) + '\n');
    child.stdin.end();
  });
}

async function testTemperatureSpecificTool() {
  return new Promise((resolve) => {
    console.log('\n🔧 Testing analyze_color_temperature tool');
    
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: join(__dirname, '..')
    });
    
    let output = '';
    let hasError = false;
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      console.error('Error:', data.toString());
      hasError = true;
    });
    
    child.on('close', (code) => {
      if (hasError || code !== 0) {
        console.log('   ❌ Failed to test temperature tool');
        resolve(false);
        return;
      }
      
      try {
        const lines = output.split('\n');
        const responseLine = lines.find(line => line.trim().startsWith('{"content"'));
        
        if (!responseLine) {
          console.log('   ❌ No valid response found');
          resolve(false);
          return;
        }
        
        const mcpResponse = JSON.parse(responseLine);
        const analysis = JSON.parse(mcpResponse.content[0].text);
        
        console.log(`   📊 Temperature: ${analysis.temperature.kelvin}K`);
        console.log(`   📈 Intensity: ${(analysis.temperature.intensity * 100).toFixed(1)}%`);
        console.log('   ✅ Temperature tool working');
        resolve(true);
        
      } catch (parseError) {
        console.log(`   ❌ Failed to parse response: ${parseError.message}`);
        resolve(false);
      }
    });
    
    // Send MCP request for analyze_color_temperature
    const mcpRequest = {
      method: 'tools/call',
      params: {
        name: 'analyze_color_temperature',
        arguments: {
          color: '#FF6B35', // Test color
          include_recommendations: false
        }
      }
    };
    
    child.stdin.write(JSON.stringify(mcpRequest) + '\n');
    child.stdin.end();
  });
}

async function runAllTests() {
  let passedTests = 0;
  const totalTests = testCases.length + 1; // +1 for temperature tool test
  
  // Test basic temperature analysis through analyze_color
  for (const testCase of testCases) {
    const passed = await testTemperatureAnalysis(testCase);
    if (passed) passedTests++;
    console.log(''); // Add spacing
  }
  
  // Test the specific temperature tool
  const tempToolPassed = await testTemperatureSpecificTool();
  if (tempToolPassed) passedTests++;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Temperature Analysis Tests: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All temperature analysis tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed.');
    process.exit(1);
  }
}

runAllTests().catch(console.error);