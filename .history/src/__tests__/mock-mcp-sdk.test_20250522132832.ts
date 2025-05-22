import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  McpServer,
  StdioServerTransport,
  McpContentItem,
} from "../mock-mcp-sdk.js";

describe("Mock MCP SDK", () => {
  describe("McpServer", () => {
    let server: McpServer;

    beforeEach(() => {
      server = new McpServer({
        name: "test-server",
        version: "1.0.0",
        capabilities: {
          resources: {},
          tools: {},
        },
      });
    });

    it("should create an instance with correct properties", () => {
      expect(server).toHaveProperty("name", "test-server");
      expect(server).toHaveProperty("version", "1.0.0");
      expect(server).toHaveProperty("tools");
      expect(server.tools).toBeInstanceOf(Map);
    });

    it("should register a tool correctly", () => {
      const schema = {
        param1: { type: "string", description: "Test parameter" },
      };

      const handler = jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "Test result" }],
      });

      server.tool("test-tool", "Test tool description", schema, handler);

      expect(server.tools.has("test-tool")).toBe(true);
      const tool = server.tools.get("test-tool");
      expect(tool).toHaveProperty("name", "test-tool");
      expect(tool).toHaveProperty("description", "Test tool description");
      expect(tool).toHaveProperty("schema", schema);
      expect(tool).toHaveProperty("handler", handler);
    });

    it("should handle tool execution", async () => {
      const handler = jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "Test result" }],
      });

      server.tool("test-tool", "Test tool description", {}, handler);

      const params = { testParam: "value" };
      const result = await server.executeTool("test-tool", params);

      expect(handler).toHaveBeenCalledWith(params);
      expect(result).toEqual({
        content: [{ type: "text", text: "Test result" }],
      });
    });

    it("should throw error for non-existent tool", async () => {
      await expect(async () => {
        await server.executeTool("non-existent-tool", {});
      }).rejects.toThrow("Tool not found: non-existent-tool");
    });
  });

  describe("StdioServerTransport", () => {
    let transport: StdioServerTransport;
    let mockServer: McpServer;
    let originalConsoleLog: any;
    let mockLog: jest.Mock;

    beforeEach(() => {
      mockServer = new McpServer({
        name: "test-server",
        version: "1.0.0",
        capabilities: {
          resources: {},
          tools: {},
        },
      });

      // Mock console.log
      originalConsoleLog = console.log;
      mockLog = jest.fn();
      console.log = mockLog;

      transport = new StdioServerTransport(mockServer);
    });

    afterEach(() => {
      console.log = originalConsoleLog;
    });

    it("should create an instance with server reference", () => {
      expect(transport).toHaveProperty("server", mockServer);
    });
  });

  describe("McpContentItem", () => {
    it("should create text content item", () => {
      const textItem: McpContentItem = { type: "text", text: "Test content" };
      expect(textItem).toHaveProperty("type", "text");
      expect(textItem).toHaveProperty("text", "Test content");
    });

    it("should create code content item", () => {
      const codeItem: McpContentItem = {
        type: "code",
        code: 'console.log("Hello")',
        language: "javascript",
      };
      expect(codeItem).toHaveProperty("type", "code");
      expect(codeItem).toHaveProperty("code", 'console.log("Hello")');
      expect(codeItem).toHaveProperty("language", "javascript");
    });
  });
});
