// Simple test file to verify that the project builds correctly
console.log("GitHub MCP Server with Cardano capabilities - Build Test");
console.log("This file is used to test that the TypeScript compilation works.");

// Import some of our project files to verify they compile
import { McpServer, StdioServerTransport } from "./mock-mcp-sdk.js";
import { isCardanoNodeRunning, getNodeStatus } from "./cardano-node.js";
import { isValidAikenSyntax } from "./aiken.js";

// Create a test server
const testServer = new McpServer({
  name: "test-mcp",
  version: "1.0.0",
  capabilities: {},
});

console.log(`Server created: ${testServer.name} v${testServer.version}`);
console.log("Build test completed successfully!");
