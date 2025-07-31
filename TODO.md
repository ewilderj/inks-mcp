# Outstanding Work Items for Fountain Pen Ink MCP Server

## ✅ Recently Completed

- [x] Document enhanced get_color_palette features in README
- [x] Add harmony generation examples and new parameters to README
- [x] Add test suite documentation to README
- [x] Fix package.json test script to use new test runner
- [x] Remove placeholder test command
- [x] Remove backup mcp-test.json file
- [x] Consolidate MCP configuration
- [x] Add GPLv3 license and update README
- [x] Add usage examples for each tool

## 🟡 Medium Priority (Nice to Have)

- [ ] Add more specific error types and improve error messages in test files
- [ ] Add input validation helpers
- [ ] Add JSDoc comments to main functions
- [ ] Create API documentation
- [ ] Add performance benchmarks
- [ ] Add integration tests with real MCP clients
- [ ] Add data validation tests

## 🟢 Low Priority (Future Enhancements)

- [ ] Implement color temperature analysis
  - Scope:
    - Define a warmth score in the range [-1, 1] (cool → warm) derived from HSL hue, attenuated by saturation and lightness.
    - Add color_temperature to analyze_color response: { score, label } where label ∈ { "cool", "neutral", "warm" }.
    - Optionally allow filtering by temperature in search_inks_by_color or add a dedicated get_inks_by_temperature tool.
    - Add unit tests for canonical colors (#FF0000 warm, #0000FF cool, grays neutral) and a couple of integration checks.
    - Document behavior and examples in README and examples/USAGE.md.
