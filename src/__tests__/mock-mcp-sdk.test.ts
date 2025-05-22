// filepath: /workspaces/github-mcp-server/src/__tests__/mock-mcp-sdk.test.ts
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { McpServer, StdioServerTransport } from '../mock-mcp-sdk.js';

describe('Mock MCP SDK', () => {
  describe('McpServer', () => {
    let server: McpServer;
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      server = new McpServer({
        name: 'test-server',
        version: '1.0.0',
        capabilities: {
          resources: {},
          tools: {},
        },
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should create an instance with correct properties', () => {
      expect(server).toHaveProperty('name', 'test-server');
      expect(server).toHaveProperty('version', '1.0.0');
      expect(server).toHaveProperty('capabilities');
    });

    it('should register a tool correctly', () => {
      const schema = {
        param1: { type: 'string', description: 'Test parameter' },
      };

      const handler = jest
        .fn<() => Promise<{ content: { type: string; text: string }[] }>>()
        .mockResolvedValue({
          content: [{ type: 'text', text: 'Test result' }],
        });

      server.tool('test-tool', 'Test tool description', schema, handler);

      // Verify tool registration was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Registered tool: test-tool')
      );
    });

    it('should connect to a transport', async () => {
      const transport = new StdioServerTransport();
      await server.connect(transport);

      // Verify connection was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connected to transport')
      );
    });
  });

  describe('StdioServerTransport', () => {
    it('should create an instance', () => {
      const transport = new StdioServerTransport();
      expect(transport).toBeInstanceOf(StdioServerTransport);
    });
  });
});
