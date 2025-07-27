# Fountain Pen Ink MCP Server

A Model Context Protocol (MCP) server that provides LLMs with specialized knowledge about fountain pen inks, enabling intelligent ink search, color matching, and recommendations.

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
- **get_color_palette**: Generate themed ink palettes for different moods and styles

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup
```bash
# Clone or create the project
git clone <repository-url>
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

### VS Code Integration

For VS Code users, the project includes:
- **Tasks**: Build, watch, and run the server
- **MCP Configuration**: Pre-configured in `.vscode/mcp.json`
- **Debug Support**: Use VS Code's integrated terminal to test the server

## Available Tools

### search_inks_by_name
Search for fountain pen inks using fuzzy text matching.

**Parameters:**
- `query` (string): Search term for ink name
- `max_results` (number, optional): Maximum results to return (default: 20)

**Example:**
```json
{
  "query": "sailor blue",
  "max_results": 10
}
```

### search_inks_by_color
Find inks similar to a given color using RGB color space matching.

**Parameters:**
- `color` (string): Hex color code (e.g., "#FF5733")
- `max_results` (number, optional): Maximum results to return (default: 20)

**Example:**
```json
{
  "color": "#2E5984",
  "max_results": 15
}
```

### get_ink_details
Get complete information about a specific ink.

**Parameters:**
- `ink_id` (string): The unique identifier for the ink

**Example:**
```json
{
  "ink_id": "sailor-ink-studio-462"
}
```

### get_inks_by_maker
List all inks from a specific manufacturer.

**Parameters:**
- `maker` (string): Manufacturer name (e.g., "sailor", "diamine", "pilot")
- `max_results` (number, optional): Maximum results to return (default: 50)

**Example:**
```json
{
  "maker": "diamine",
  "max_results": 25
}
```

### analyze_color
Analyze a color and provide fountain pen ink context.

**Parameters:**
- `color` (string): Hex color code (e.g., "#FF5733")

**Example:**
```json
{
  "color": "#8B4513"
}
```

### get_color_palette
Generate a themed palette of fountain pen inks.

**Parameters:**
- `theme` (string): Theme for the palette ("warm", "cool", "earth", "ocean", "autumn", "spring")
- `palette_size` (number, optional): Number of inks in palette (default: 5)

**Example:**
```json
{
  "theme": "ocean",
  "palette_size": 6
}
```

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
└── .vscode/
    ├── mcp.json      # MCP server configuration
    └── tasks.json    # VS Code tasks
```

### Scripts
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run the compiled server
- `npm run dev`: Build and run in one command
- `npm run watch`: Watch for changes and rebuild automatically

### Testing
You can test the server by running it and sending MCP protocol messages via stdin/stdout, or integrate it with an MCP-compatible client.

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

ISC License - see LICENSE file for details.

## Links

- [Wilder Writes](https://wilderwrites.ink/) - Source of ink data and detailed ink information
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP documentation and examples
