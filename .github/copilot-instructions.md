# Copilot Instructions for Fountain Pen Ink MCP Server

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is an MCP (Model Context Protocol) server project for fountain pen ink knowledge and recommendations.

## Project Context

You can find more info and examples at https://modelcontextprotocol.io/llms-full.txt

Additional reference: https://github.com/modelcontextprotocol/create-python-server

## Project Goals

This MCP server provides LLMs with specialized knowledge about fountain pen inks, including:
- Searching inks by name using fuzzy matching
- Finding inks by color similarity using RGB values
- Getting detailed ink information including maker, properties, and metadata
- Generating ink recommendations based on user preferences
- Providing color analysis and palette generation

## Data Structure

The server works with two main data sources:
- `ink-colors.json`: Contains ink RGB values, names, and IDs
- `search.json`: Contains additional metadata like makers and scan dates

## Key Features to Implement

1. **search_inks_by_name**: Fuzzy text search for ink names
2. **search_inks_by_color**: RGB-based color similarity matching
3. **get_ink_details**: Retrieve complete ink information
4. **get_inks_by_maker**: Filter inks by manufacturer
5. **recommend_inks**: Intelligent ink recommendations
6. **analyze_color**: Color analysis with ink context
7. **get_color_palette**: Generate themed ink palettes

## Technical Notes

- Use Euclidean distance for RGB color matching
- Implement fuzzy search for name matching
- Include links to https://wilderwrites.ink/ink/{ink_id} for detailed ink pages
- Reference ink images at https://wilderwrites.ink/images/inks/{ink_id}-sq.jpg
- Use TypeScript with proper type definitions
- Follow MCP SDK patterns for tool definitions and handlers
