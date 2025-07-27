#!/usr/bin/env node

// Test Runner for Fountain Pen Ink MCP Server
// Runs all relevant tests and provides a summary

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Fountain Pen Ink MCP Server Test Suite\n');
console.log('='.repeat(60));

const tests = [
  {
    name: 'Enhanced Palette Features',
    file: 'test-enhanced-palette.js',
    description: 'Tests new themes, harmony generation, and custom palettes'
  },
  {
    name: 'MCP Protocol Integration',
    file: 'test-mcp-palette.js', 
    description: 'Tests MCP protocol compliance for palette tool'
  },
  {
    name: 'Tool Schema Validation',
    file: 'test-schema.js',
    description: 'Validates tool schemas are properly exposed'
  },
  {
    name: 'Harmony Generation',
    file: 'test-harmony-direct.js',
    description: 'Tests color harmony algorithms directly'
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n📋 Running: ${test.name}`);
    console.log(`📄 ${test.description}`);
    console.log('-'.repeat(40));
    
    const child = spawn('node', [join(__dirname, test.file)], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: join(__dirname, '..')
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      const success = code === 0;
      console.log(success ? '✅ PASSED' : '❌ FAILED');
      
      if (stdout) {
        console.log('Output:', stdout.slice(0, 200) + (stdout.length > 200 ? '...' : ''));
      }
      
      if (stderr && !success) {
        console.log('Error:', stderr.slice(0, 200));
      }
      
      resolve({ name: test.name, success, code });
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The MCP server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
}

runAllTests().catch(console.error);
