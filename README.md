# Fountain Pen Ink MCP Server

A Model Context Protocol (MCP) server that provides LLMs with specialized knowledge about fountain pen inks, enabling intelligent ink search, color matching, and recommendations. [Read my article about creating this server](https://www.linkedin.com/pulse/my-first-mcp-server-weekend-experiment-ai-pair-edd-wilder-james-jjric).

<a href="https://glama.ai/mcp/servers/@ewilderj/inks-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@ewilderj/inks-mcp/badge" alt="Fountain Pen Ink Server MCP server" />
</a>

[![CI](https://github.com/ewilderj/inks-mcp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ewilderj/inks-mcp/actions/workflows/ci.yml)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![ESLint](https://img.shields.io/badge/lint-eslint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org)

## Features

This MCP server provides the following tools for LLMs:

### 🔍 Search Tools

- **search_inks_by_name**: Fuzzy search for inks by name or manufacturer
- **search_inks_by_color**: Find inks similar to any given color using RGB matching
- **get_inks_by_maker**: List all inks from a specific manufacturer

### 📊 Information Tools

- **get_ink_details**: Get comprehensive information about a specific ink
- **analyze_color**: Analyze any color and find the closest matching inks

### 🎨 Recommendation Tools

- **get_color_palette**: Generate sophisticated themed ink palettes with color theory support
  - 13 predefined themes (warm, cool, earth, ocean, autumn, spring, summer, winter, pastel, vibrant, monochrome, sunset, forest)
  - Color harmony generation (complementary, analogous, triadic, split-complementary)
  - Custom hex color palettes

## Quick start

```bash
git clone https://github.com/ewilderj/inks-mcp.git
cd inks-mcp
npm install
npm run build

# List tools and run a sample query
npm run tools:list
npm run client -- --tool search_inks_by_name --args '{"query":"sailor blue","max_results":5}'
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

```bash
# Clone the project
git clone https://github.com/ewilderj/inks-mcp.git
cd inks-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Running the Server

```bash
# Run once
npm start

# Development mode with auto-rebuild
npm run dev

# Watch mode for development
npm run watch
```

### MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "servers": {
    "fountain-pen-ink-server": {
      "type": "stdio",
      "command": "node",
      "args": ["<path-to-project>/dist/index.js"]
    }
  }
}
```

### CLI Client (Generic)

A small script is included to exercise any tool from the command line:

```bash
# List tools
npm run tools:list

# Call a tool with inline JSON args
npm run client -- --tool search_inks_by_name --args '{"query":"sailor blue","max_results":5}'

# Call with arguments from a file
npm run client -- --tool get_color_palette --args-file examples/palette.complementary.json

# Change output mode (auto | content | raw)
npm run client -- --tool search_inks_by_color --args '{"color":"#2E5984"}' --output content
```

Script options:

- `--list` List available tools
- `--tool <name>` Tool name to call
- `--args '<json>'` Inline JSON arguments
- `--args-file <path>` JSON file with arguments
- `--server <path>` Path to compiled server (default: dist/index.js)
- `--timeout <ms>` Timeout in milliseconds (default: 10000)
- `--output <mode>` Output mode: auto | content | raw (default: auto)

## Available Tools

### search_inks_by_name

Search for fountain pen inks using fuzzy text matching.

Parameters: `query` (string), `max_results` (number, optional)

Example input:

```json
{ "query": "sailor blue", "max_results": 10 }
```

Example prompt:

- Find inks matching "sailor blue"; limit to 10 results.

### search_inks_by_color

Find inks similar to a given color using RGB color space matching.

Parameters: `color` (hex string), `max_results` (number, optional)

Example input:

```json
{ "color": "#2E5984", "max_results": 15 }
```

Example prompt:

- Find inks similar to color #2E5984; up to 15 results.

### get_ink_details

Get complete information about a specific ink.

Parameters: `ink_id` (string)

Example input:

```json
{ "ink_id": "diamine-oxblood" }
```

Example prompt:

- Show info for "diamine-oxblood".

### get_inks_by_maker

List all inks from a specific manufacturer.

Parameters: `maker` (string), `max_results` (number, optional)

Example input:

```json
{ "maker": "diamine", "max_results": 25 }
```

Example prompt:

- List Diamine inks; limit 25.

### analyze_color

Analyze a color and provide fountain pen ink context.

Parameters: `color` (hex string), `max_results` (number, optional)

Example input:

```json
{ "color": "#2E5984", "max_results": 7 }
```

Example prompt:

- Analyze #2E5984 and show the top 7 closest inks.

### get_color_palette

Generate a themed or harmony-based palette of fountain pen inks with color theory support.

Parameters: `theme` (string), `palette_size` (number, optional), `harmony` (string, optional)

Supported Themes:
- Classic: warm, cool, earth, ocean, autumn, spring
- Seasonal: summer, winter
- Mood: pastel, vibrant, monochrome
- Atmospheric: sunset, forest

Harmony Rules: complementary, analogous, triadic, split-complementary

Example input:

```json
{ "theme": "sunset", "palette_size": 4 }
```

Example prompt:

- Generate a 4‑ink palette for the "sunset" theme.

For more examples, see `examples/USAGE.md`.

## Data Sources

The server uses two main data files:

- **ink-colors.json**: Contains RGB color values and basic ink information
- **search.json**: Contains metadata including manufacturers, scan dates, and searchable names

All ink data links back to [Wilder Writes](https://wilderwrites.ink/) for detailed information and images.

## Development

### Project Structure

```
inks-mcp/
├── src/
│   ├── index.ts      # Main MCP server implementation
│   ├── types.ts      # TypeScript type definitions
│   └── utils.ts      # Utility functions for color matching
├── data/
│   ├── ink-colors.json   # RGB color data
│   └── search.json       # Search metadata
├── dist/             # Compiled JavaScript (generated)
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run the compiled server
- `npm run dev`: Build and run in one command
- `npm run watch`: Watch for changes and rebuild automatically
- `npm run client`: Run the generic CLI client
- `npm run tools:list`: List available tools via the CLI client

## Testing

Run the comprehensive test suite to validate all functionality:

```bash
npm test

# Run individual test categories
cd test
node test-enhanced-palette.js    # Palette generation features
node test-mcp-palette.js        # MCP protocol compliance
node test-schema.js             # Tool schema validation
node test-harmony-direct.js     # Color harmony algorithms
```

For manual, ad‑hoc testing, use the CLI client documented above.

The test suite covers:

- ✅ 13 predefined themes + 4 harmony rules
- ✅ Custom color palette generation
- ✅ MCP protocol compliance
- ✅ Error handling and validation
- ✅ Color space conversions (BGR→RGB, RGB↔HSL)

## Color Matching Algorithm

The server uses Euclidean distance in RGB color space to find similar inks:

```
distance = √[(r₁-r₂)² + (g₁-g₂)² + (b₁-b₂)²]
```

Future improvements may include:

- LAB color space for better perceptual accuracy
- Weighted color components for fountain pen ink characteristics
- Semantic color descriptions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).
See the LICENSE file for details.

## Links

- [Wilder Writes](https://wilderwrites.ink/) - Source of ink data and detailed ink information
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP documentation and examples
