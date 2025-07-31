# Usage Examples

This page shows example inputs you can copy into your MCP client for each tool.

Note: Replace paths/commands as needed depending on your client. All tools return JSON.

## search_inks_by_name

Find inks by fuzzy name or maker.

Example inputs:

```json
{
  "query": "sailor blue",
  "max_results": 10
}
```

```json
{
  "query": "iroshizuku yama",
  "max_results": 5
}
```

Example prompts:

- Find inks matching "sailor blue"; limit to 10 results.
- Search for inks similar to "iroshizuku yama" and return up to 5.

## search_inks_by_color

Find inks closest to a given color.

Example inputs:

```json
{
  "color": "#2E5984",
  "max_results": 15
}
```

```json
{
  "color": "#8B4513"
}
```

Example prompts:

- Find inks similar to color #2E5984; up to 15 results.
- Show inks closest to #8B4513.

## get_ink_details

Get full details for an ink by ID.

Example inputs:

```json
{
  "ink_id": "sailor-ink-studio-462"
}
```

```json
{
  "ink_id": "diamine-oxblood"
}
```

Example prompts:

- Get details for ink "sailor-ink-studio-462".
- Show info for "diamine-oxblood".

## get_inks_by_maker

List inks from a specific manufacturer.

Example inputs:

```json
{
  "maker": "diamine",
  "max_results": 25
}
```

```json
{
  "maker": "pilot",
  "max_results": 10
}
```

Example prompts:

- List Diamine inks; limit 25.
- Show 10 Pilot inks.

## analyze_color

Analyze a color and get closest inks.

Example inputs:

```json
{
  "color": "#8B4513"
}
```

```json
{
  "color": "#2E5984",
  "max_results": 7
}
```

Example prompts:

- Analyze color #8B4513 and suggest the closest inks.
- Analyze #2E5984 and show the top 7 closest inks.

## get_color_palette

Generate themed or harmony-based palettes. Three modes are supported.

1) Predefined themes

Supported themes: warm, cool, earth, ocean, autumn, spring, summer, winter, pastel, vibrant, monochrome, sunset, forest

```json
{
  "theme": "sunset",
  "palette_size": 4
}
```

```json
{
  "theme": "monochrome",
  "palette_size": 5
}
```

Example prompts:

- Generate a 4‑ink palette for the "sunset" theme.
- Create a 5‑ink monochrome palette.

2) Custom hex color lists

Provide comma-separated hex colors.

```json
{
  "theme": "#FF6B35,#F7931E,#FFD700",
  "palette_size": 3
}
```

Example prompt:

- Create a 3‑ink palette from #FF6B35, #F7931E, and #FFD700.

3) Color harmony generation

Give a single base color and a harmony rule: complementary, analogous, triadic, split-complementary

```json
{
  "theme": "#2E5984",
  "harmony": "complementary",
  "palette_size": 2
}
```

```json
{
  "theme": "#0000FF",
  "harmony": "triadic",
  "palette_size": 3
}
```

Example prompts:

- Generate a 2‑ink complementary palette from base color #2E5984.
- Generate a 3‑ink triadic palette from base color #0000FF.
