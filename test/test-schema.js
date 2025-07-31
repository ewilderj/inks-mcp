#!/usr/bin/env node

// Test the MCP server schema to verify harmony parameter is exposed

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testing MCP Server Schema...\n');

const repoRoot = join(__dirname, '..');
const server = spawn('npm', ['start'], { cwd: repoRoot });

let stdout = '';

server.stdout.on('data', (data) => {
  stdout += data.toString();
});

server.stderr.on('data', (data) => {
  console.log('Server stderr:', data.toString());
});

// Send list_tools request
setTimeout(() => {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  };

  server.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

// Process response and look for get_color_palette tool
setTimeout(() => {
  try {
    const lines = stdout.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.result && response.result.tools) {
          const paletteTool = response.result.tools.find(
            (tool) => tool.name === 'get_color_palette',
          );
          if (paletteTool) {
            console.log('✅ Found get_color_palette tool schema:');
            console.log('Description:', paletteTool.description);
            console.log('\nParameters:');
            Object.entries(paletteTool.inputSchema.properties).forEach(([key, value]) => {
              console.log(`• ${key}:`, value.description);
              if (value.enum) {
                console.log(`  Allowed values: ${value.enum.join(', ')}`);
              }
            });

            if (paletteTool.inputSchema.properties.harmony) {
              console.log('\n🎉 SUCCESS: harmony parameter is properly exposed!');
            } else {
              console.log('\n❌ PROBLEM: harmony parameter missing');
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  } catch (error) {
    console.error('Error parsing response:', error);
  }

  server.kill();
}, 3000);

setTimeout(() => {
  console.log('\nTest complete.');
  process.exit(0);
}, 4000);
