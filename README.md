# GitHub MCP Server

A Model Context Protocol (MCP) server for GitHub integration. This server provides tools for interacting with the GitHub API via the Model Context Protocol.

## Features

This MCP server provides the following tools:

1. **search-repositories**: Search for GitHub repositories matching a query
2. **get-repository-issues**: Get issues from a GitHub repository
3. **get-repository-contents**: Get the contents of a file or directory in a GitHub repository

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## Usage

### Starting the server

```bash
npm start
```

### Authentication

For authenticated access to private repositories or to avoid rate limits, you can provide a GitHub personal access token to each tool call. This is optional but recommended for increased functionality.

### Integration with Claude for Desktop

To use this server with Claude for Desktop:

1. Make sure Claude for Desktop is installed and updated to the latest version
2. Open your Claude for Desktop configuration at:
   - Windows: `%AppData%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Add the GitHub MCP server configuration:

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "node",
      "args": [
        "PATH_TO_SERVER/build/index.js"
      ]
    }
  }
}
```

4. Replace `PATH_TO_SERVER` with the absolute path to your server directory
5. Restart Claude for Desktop

## Development

To build and run the server in development mode:

```bash
npm run dev
```

## License

MIT
"# github-mcp-server" 
