#!/usr/bin/env node

// Direct test of the MCP server to confirm harmony parameter works

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

console.log('🔍 Testing MCP Server Harmony Parameter...\n');

const server = spawn('node', ['dist/index.js'], { cwd: repoRoot });

let stdout = '';
let requestId = 1;

server.stdout.on('data', (data) => {
  stdout += data.toString();
});

server.stderr.on('data', (data) => {
  console.log('Server loaded:', data.toString().trim());
});

// Send list_tools request
setTimeout(() => {
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/list'
  };
  
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Send actual harmony test request
setTimeout(() => {
  const harmonyRequest = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: 'get_color_palette',
      arguments: {
        theme: '#FF0000',
        harmony: 'complementary',
        palette_size: 2
      }
    }
  };
  
  console.log('🎯 Sending harmony test request:', JSON.stringify(harmonyRequest, null, 2));
  server.stdin.write(JSON.stringify(harmonyRequest) + '\n');
}, 2000);

// Process all responses
setTimeout(() => {
  const lines = stdout.split('\n').filter(line => line.trim());
  
  console.log('\n📄 Server Responses:');
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      
      if (response.result && response.result.tools) {
        const paletteTool = response.result.tools.find(tool => tool.name === 'get_color_palette');
        if (paletteTool) {
          console.log('\n✅ Tool Schema:');
          console.log('Has harmony parameter:', !!paletteTool.inputSchema.properties.harmony);
          if (paletteTool.inputSchema.properties.harmony) {
            console.log('Harmony enum values:', paletteTool.inputSchema.properties.harmony.enum);
          }
        }
      } else if (response.result && response.result.content) {
        console.log('\n🎨 Harmony Test Result:');
        const content = response.result.content[0].text;
        const palette = JSON.parse(content);
        console.log('Theme:', palette.theme);
        console.log('Inks found:', palette.inks.length);
        palette.inks.forEach((ink, i) => {
          console.log(`${i + 1}. ${ink.name} (${ink.maker}) - ${ink.hex_color}`);
        });
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }
  
  server.kill();
}, 4000);

setTimeout(() => {
  console.log('\nTest complete.');
  process.exit(0);
}, 5000);
