#!/usr/bin/env node

// Test MCP Server Temperature Tools
// Tests the MCP server endpoints for temperature analysis

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Testing MCP Server Temperature Tools\n');

async function testMCPTool(toolName, args) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing: ${toolName}`);
    
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: join(__dirname, '..')
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (errorOutput.includes('Error:') || code !== 0) {
        console.log(`   ❌ Failed: ${errorOutput}`);
        resolve(false);
        return;
      }
      
      try {
        // Find the JSON response line
        const lines = output.split('\n');
        const responseLine = lines.find(line => line.trim().startsWith('{"content"'));
        
        if (!responseLine) {
          console.log('   ❌ No valid MCP response found');
          resolve(false);
          return;
        }
        
        const mcpResponse = JSON.parse(responseLine);
        const result = JSON.parse(mcpResponse.content[0].text);
        
        console.log(`   ✅ Success: ${toolName} returned valid data`);
        
        if (toolName === 'analyze_color') {
          if (result.temperature) {
            console.log(`      Temperature: ${result.temperature.kelvin}K (${result.temperature.category})`);
          } else {
            console.log('      ⚠️  No temperature data found in analyze_color');
          }
        }
        
        if (toolName === 'analyze_color_temperature') {
          if (result.temperature) {
            console.log(`      Temperature: ${result.temperature.kelvin}K`);
            console.log(`      Intensity: ${(result.temperature.intensity * 100).toFixed(1)}%`);
            if (result.temperature_recommendations) {
              console.log(`      Recommendations included: ${result.temperature_recommendations.similar_temperature_inks.length} similar inks`);
            }
          } else {
            console.log('      ❌ No temperature data found');
            resolve(false);
            return;
          }
        }
        
        resolve(true);
        
      } catch (parseError) {
        console.log(`   ❌ Parse error: ${parseError.message}`);
        resolve(false);
      }
    });
    
    // Send MCP request
    const mcpRequest = {
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    child.stdin.write(JSON.stringify(mcpRequest) + '\n');
    child.stdin.end();
  });
}

async function runTests() {
  console.log('Testing MCP Server Temperature Analysis');
  console.log('='.repeat(50));
  
  const tests = [
    {
      name: 'analyze_color',
      args: { color: '#FF6B35' } // Warm orange
    },
    {
      name: 'analyze_color_temperature',
      args: { color: '#4A90E2', include_recommendations: false } // Cool blue
    },
    {
      name: 'analyze_color_temperature',
      args: { color: '#FF6B35', include_recommendations: true } // With recommendations
    }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    const success = await testMCPTool(test.name, test.args);
    if (success) passed++;
    console.log(''); // Add spacing
  }
  
  console.log('='.repeat(50));
  console.log(`📊 MCP Temperature Tests: ${passed}/${tests.length} passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All MCP temperature tools working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some MCP tests failed.');
    process.exit(1);
  }
}

runTests().catch(console.error);