#!/usr/bin/env node

// VS Code MCP Test - Creates a simple test you can run in VS Code

console.log(`
🔧 VS Code MCP Debugging Steps:

1. **Kill all MCP processes:**
   Run this in terminal: pkill -f "inks-mcp"

2. **Force rebuild:**
   Run: npm run build

3. **Restart VS Code completely:**
   Quit VS Code entirely and reopen

4. **Test the tool in VS Code:**
   Try: "use get_color_palette with theme #FF0000 and harmony complementary"

5. **If still not working, try the alternative config:**
   Rename .vscode/mcp.json to .vscode/mcp-old.json
   Rename .vscode/mcp-test.json to .vscode/mcp.json
   Restart VS Code

🎯 Expected Result:
The tool should now accept these parameters:
- theme: "#FF0000" (or any theme name)
- harmony: "complementary" (or analogous, triadic, split-complementary) 
- palette_size: 2

🔍 To verify manually:
Ask VS Code: "show me all parameters for get_color_palette"
You should see THREE parameters, including 'harmony'

📝 Current Schema Status:
✅ Source code has harmony parameter
✅ Compiled dist/index.js has harmony parameter  
✅ Direct MCP server test works
❌ VS Code client not seeing the parameter

This is a VS Code MCP client caching issue.
`);

// Also test if we can call the tool directly
import('./test-harmony-direct.js');
