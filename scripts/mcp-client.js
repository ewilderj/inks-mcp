#!/usr/bin/env node

// Generic MCP client for inks-mcp: call any tool with CLI args
// Requires a built server at dist/index.js

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

function printUsage() {
  console.log(`\nUsage: node scripts/mcp-client.js [--list] --tool <name> --args '<json>' [options]\n\nOptions:\n  --list                 List available tools (ignores --tool/--args)\n  --tool <name>          Tool name to call (e.g., search_inks_by_name)\n  --args '<json>'        JSON string of arguments for the tool\n  --args-file <path>     Path to JSON file with arguments\n  --server <path>        Path to compiled server (default: dist/index.js)\n  --timeout <ms>         Timeout in milliseconds (default: 10000)\n  --output <mode>        Output mode: auto | content | raw (default: auto)\n\nExamples:\n  # List tools\n  node scripts/mcp-client.js --list\n\n  # Search by name\n  node scripts/mcp-client.js --tool search_inks_by_name --args '{"query":"sailor blue","max_results":5}'\n\n  # Search by color\n  node scripts/mcp-client.js --tool search_inks_by_color --args '{"color":"#2E5984","max_results":10}'\n\n  # Get color palette (complementary harmony)\n  node scripts/mcp-client.js --tool get_color_palette --args '{"theme":"#2E5984","harmony":"complementary","palette_size":3}'\n`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') args.list = true;
    else if (a === '--tool') args.tool = argv[++i];
    else if (a === '--args') args.args = argv[++i];
    else if (a === '--args-file') args.argsFile = argv[++i];
    else if (a === '--server') args.server = argv[++i];
    else if (a === '--timeout') args.timeout = parseInt(argv[++i], 10);
    else if (a === '--output') args.output = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else {
      console.warn(`Unknown argument: ${a}`);
    }
  }
  return args;
}

function loadArgs(args) {
  if (args.args) {
    try {
      return JSON.parse(args.args);
    } catch (e) {
      throw new Error(`Failed to parse --args JSON: ${e.message}`);
    }
  }
  if (args.argsFile) {
    if (!existsSync(args.argsFile)) {
      throw new Error(`--args-file not found: ${args.argsFile}`);
    }
    try {
      const txt = readFileSync(args.argsFile, 'utf8');
      return JSON.parse(txt);
    } catch (e) {
      throw new Error(`Failed to read/parse --args-file: ${e.message}`);
    }
  }
  return {};
}

function parseServerOutput(stdout) {
  // Server writes one JSON object per line; find the first valid JSON with result
  const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.result) return obj;
    } catch {}
  }
  // Fallback: try last line
  if (lines.length) {
    try {
      return JSON.parse(lines[lines.length - 1]);
    } catch {}
  }
  throw new Error('No valid JSON-RPC response found');
}

async function callServer(method, params, serverPath, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    const request = { jsonrpc: '2.0', id: 1, method, params };
    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();

    const to = setTimeout(() => {
      child.kill();
      reject(new Error('Timeout'));
    }, timeoutMs);

    child.on('close', () => {
      clearTimeout(to);
      if (!stdout.trim() && stderr.trim()) {
        reject(new Error(`Server error: ${stderr.trim()}`));
        return;
      }
      try {
        const parsed = parseServerOutput(stdout);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`${e.message}. Raw output: ${stdout || stderr}`));
      }
    });
  });
}

function printResult(response, outputMode = 'auto') {
  if (outputMode === 'raw') {
    console.log(JSON.stringify(response, null, 2));
    return;
  }

  const res = response.result || response;
  const content = res.content;

  if (outputMode === 'content' || outputMode === 'auto') {
    if (Array.isArray(content) && content.length && content[0].type === 'text') {
      const text = content[0].text;
      try {
        const parsedText = JSON.parse(text);
        console.log(JSON.stringify(parsedText, null, 2));
        return;
      } catch {
        // Not JSON; print as-is
        console.log(text);
        return;
      }
    }
    if (outputMode === 'content') {
      console.log('# No textual content in response. Showing raw result:');
      console.log(JSON.stringify(res, null, 2));
      return;
    }
  }

  // Fallback: print the entire result
  console.log(JSON.stringify(res, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) return printUsage();

  const serverPath = args.server || path.join('dist', 'index.js');
  const timeoutMs = Number.isFinite(args.timeout) ? args.timeout : 10000;
  const outputMode = args.output || 'auto';

  try {
    if (args.list) {
      const response = await callServer('tools/list', {}, serverPath, timeoutMs);
      printResult(response, outputMode);
      return;
    }

    if (!args.tool) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    const toolArgs = loadArgs(args);
    const params = { name: args.tool, arguments: toolArgs };
    const response = await callServer('tools/call', params, serverPath, timeoutMs);
    printResult(response, outputMode);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exitCode = 1;
  }
}

main();
