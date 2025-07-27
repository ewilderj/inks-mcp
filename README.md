# Fountain Pen Ink MCP Server

A Model Context Protocol (MCP) server that provides LLMs with specialized knowledge about fountain pen inks, enabling intelligent ink search, color matching, and recommendations. [Read my article about creating this server](https://www.linkedin.com/pulse/my-first-mcp-server-weekend-experiment-ai-pair-edd-wilder-james-jjric).

<a href="https://glama.ai/mcp/servers/@ewilderj/inks-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@ewilderj/inks-mcp/badge" alt="Fountain Pen Ink Server MCP server" />
</a>

## Features

This MCP server provides the following tools for LLMs:

### 🌡️ Color Temperature Analysis
- **Temperature calculation**: Precise Kelvin temperature measurement (2000K-8000K)
- **Temperature categorization**: Warm, cool, and neutral classification
- **Seasonal recommendations**: Season matching based on temperature characteristics
- **Temperature-based filtering**: Search and filter inks by temperature category

### 🔍 Search Tools
- **search_inks_by_name**: Fuzzy search for inks by name or manufacturer
- **search_inks_by_color**: Find inks similar to any given color using RGB matching with optional temperature filtering
- **get_inks_by_maker**: List all inks from a specific manufacturer

### 📊 Information Tools
- **get_ink_details**: Get comprehensive information about a specific ink
- **analyze_color**: Analyze any color and find the closest matching inks with temperature analysis
- **analyze_color_temperature**: Dedicated tool for detailed color temperature analysis and recommendations

### 🎨 Recommendation Tools
- **get_color_palette**: Generate sophisticated themed ink palettes with color theory and temperature analysis
  - 17+ predefined themes including temperature-specific themes (warm-reds, cool-blues, neutral-grays, temperature-gradient)
  - Color harmony generation (complementary, analogous, triadic, split-complementary)
  - Custom hex color palettes
  - Automatic temperature analysis for all palettes

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
Find inks similar to a given color using RGB color space matching with optional temperature filtering.

**Parameters:**
- `color` (string): Hex color code (e.g., "#FF5733")
- `max_results` (number, optional): Maximum results to return (default: 20)
- `temperature_filter` (string, optional): Filter by temperature category ("warm", "cool", "neutral")

**Examples:**
```json
// Basic color search
{
  "color": "#2E5984",
  "max_results": 15
}

// Search with temperature filtering
{
  "color": "#2E5984",
  "max_results": 10,
  "temperature_filter": "cool"
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
Analyze a color and provide fountain pen ink context with temperature analysis.

**Parameters:**
- `color` (string): Hex color code (e.g., "#FF5733")

**Example:**
```json
{
  "color": "#8B4513"
}
```

**Sample Response:**
```json
{
  "hex": "#8B4513",
  "rgb": [139, 69, 19],
  "closest_inks": [...],
  "color_family": "brown",
  "description": "dark warm brown",
  "temperature": {
    "kelvin": 2856,
    "category": "warm",
    "description": "warm earthy tone",
    "intensity": 0.73,
    "seasonal_match": ["autumn", "winter"],
    "complementary_temperature": 5644
  }
}
```

### analyze_color_temperature
Dedicated tool for detailed color temperature analysis and ink recommendations.

**Parameters:**
- `color` (string): Hex color code (e.g., "#FF5733")
- `include_recommendations` (boolean, optional): Include temperature-based ink recommendations (default: false)

**Examples:**
```json
// Basic temperature analysis
{
  "color": "#4A90E2"
}

// With temperature-based recommendations
{
  "color": "#FF6B35",
  "include_recommendations": true
}
```

**Sample Response with Recommendations:**
```json
{
  "color": "#FF6B35",
  "rgb": [255, 107, 53],
  "color_family": "orange",
  "temperature": {
    "kelvin": 2734,
    "category": "warm",
    "description": "very warm fiery tone",
    "intensity": 0.81,
    "seasonal_match": ["autumn", "summer"],
    "complementary_temperature": 5766
  },
  "temperature_recommendations": {
    "similar_temperature_inks": [...],
    "contrasting_temperature_inks": [...],
    "seasonal_suggestions": ["autumn", "summer"]
  }
}
```

### get_color_palette
Generate a themed or harmony-based palette of fountain pen inks with sophisticated color theory and temperature analysis support.

**Parameters:**
- `theme` (string): Theme name, comma-separated hex colors, or single hex color for harmony generation
- `palette_size` (number, optional): Number of inks in palette (default: 5)
- `harmony` (string, optional): Color harmony rule when using single hex color

**Supported Themes:**
- **Classic**: warm, cool, neutral, earth, ocean
- **Seasonal**: autumn, spring, summer, winter  
- **Mood**: pastel, vibrant, monochrome
- **Atmospheric**: sunset, forest
- **Temperature-Specific**: warm-reds, cool-blues, neutral-grays, temperature-gradient

**Harmony Rules:**
- **complementary**: Base color + opposite color
- **analogous**: Base color + adjacent colors  
- **triadic**: Base color + two equidistant colors
- **split-complementary**: Base color + colors adjacent to complement

**Examples:**
```json
// Predefined theme
{
  "theme": "sunset",
  "palette_size": 4
}

// Temperature-specific theme
{
  "theme": "warm-reds",
  "palette_size": 5
}

// Custom hex colors
{
  "theme": "#FF6B35,#F7931E,#FFD700",
  "palette_size": 3
}

// Color harmony generation
{
  "theme": "#2E5984", 
  "harmony": "complementary",
  "palette_size": 2
}
```

**Sample Response with Temperature Analysis:**
```json
{
  "theme": "warm-reds",
  "inks": [...],
  "description": "A curated palette of 5 fountain pen inks matching the warm-reds theme.",
  "temperature_analysis": {
    "average_temperature": 2580,
    "temperature_range": [2518, 2641],
    "dominant_category": "warm",
    "temperature_harmony": "monochromatic"
  }
}
```

## 🌡️ Color Temperature Analysis

This server includes advanced color temperature analysis capabilities that provide insights into the warm/cool characteristics of colors and inks.

### Temperature Scale

Colors are analyzed on the Kelvin temperature scale:
- **Warm colors**: 2000K - 3500K (reds, oranges, yellows)
- **Neutral colors**: 3500K - 5000K (balanced tones)  
- **Cool colors**: 5000K - 8000K (blues, greens, purples)

### Features

- **Automatic temperature calculation**: Every color analysis includes precise temperature measurement
- **Category classification**: Colors are classified as warm, cool, or neutral
- **Intensity measurement**: Scale from 0-1 indicating how extreme the temperature is
- **Seasonal recommendations**: Suggests appropriate seasons based on temperature
- **Temperature-based filtering**: Search for inks matching specific temperature categories
- **Palette temperature analysis**: Understand the temperature harmony in ink collections

### Temperature-Based Search

Use the `temperature_filter` parameter in `search_inks_by_color` to find inks with specific temperature characteristics:

```json
{
  "color": "#FF6B35",
  "temperature_filter": "warm",
  "max_results": 10
}
```

### Temperature-Specific Palettes

New palette themes focused on temperature characteristics:
- **warm-reds**: Collection of warm red tones (2500-3000K)
- **cool-blues**: Collection of cool blue tones (6000-7000K)  
- **neutral-grays**: Balanced neutral tones (3500-4500K)
- **temperature-gradient**: Smooth transition from warm to cool

### Use Cases

- **Seasonal writing**: Choose inks that match the mood of different seasons
- **Brand consistency**: Maintain temperature harmony across multiple ink choices
- **Artistic projects**: Create intentional warm/cool contrasts
- **Professional documents**: Select appropriate temperature for context (warm for creative, cool for technical)

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

### Testing
Run the comprehensive test suite to validate all functionality:

```bash
# Run all tests
npm test

# Run individual test categories
cd test
node test-enhanced-palette.js    # Palette generation features
node test-mcp-palette.js        # MCP protocol compliance
node test-schema.js             # Tool schema validation
node test-harmony-direct.js     # Color harmony algorithms
```

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
