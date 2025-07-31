# Test Suite for Fountain Pen Ink MCP Server

This directory contains all tests and utilities for validating the MCP server functionality.

## Running Tests

### Run All Tests

```bash
cd test
node run-all-tests.js
```

### Run Individual Tests

```bash
# Test enhanced palette features
node test-enhanced-palette.js

# Test MCP protocol integration
node test-mcp-palette.js

# Test tool schema validation
node test-schema.js

# Test harmony generation directly
node test-harmony-direct.js
```

## Test Files

### Core Functionality Tests

- **`test-enhanced-palette.js`** - Tests all new palette generation features including:
  - 7 new predefined themes (summer, winter, pastel, vibrant, monochrome, sunset, forest)
  - Color harmony generation (complementary, analogous, triadic, split-complementary)
  - Custom hex color palettes
  - Error handling

- **`test-mcp-palette.js`** - Tests MCP protocol compliance:
  - Tool schema exposure
  - Parameter validation
  - Response format compliance

- **`test-schema.js`** - Validates tool schemas:
  - All tools properly exposed
  - Parameters correctly defined
  - Enum values present

- **`test-harmony-direct.js`** - Tests color harmony algorithms:
  - HSL color space conversions
  - Harmony rule implementation
  - Direct MCP server communication

### Utilities

- **`debug-vscode-mcp.js`** - VS Code MCP debugging utility:
  - Troubleshooting steps for client caching issues
  - Schema validation
  - Process management

- **`palette-usage-guide.js`** - Comprehensive usage documentation:
  - All palette generation modes
  - Example JSON arguments
  - Feature overview

- **`run-all-tests.js`** - Test runner:
  - Executes all tests in sequence
  - Provides summary report
  - Handles test failures gracefully

## Test Coverage

The test suite covers:

✅ **Palette Generation**

- Predefined themes (13 total)
- Color harmony rules (4 types)
- Custom color palettes
- Error handling and validation

✅ **MCP Protocol**

- Tool schema compliance
- Parameter exposure
- Response formatting

✅ **Color Processing**

- BGR→RGB conversion
- HSL color space operations
- Color family detection
- Euclidean distance matching

✅ **Data Integrity**

- Ink deduplication
- Metadata correlation
- Search functionality

## Adding New Tests

When adding new tests:

1. Create test file in `/test/` directory
2. Use descriptive filename: `test-{feature}.js`
3. Add to `run-all-tests.js` tests array
4. Update this README with test description

## Requirements

- Node.js with ES module support
- Built MCP server (`npm run build`)
- Test files assume server can be started with `npm start`
