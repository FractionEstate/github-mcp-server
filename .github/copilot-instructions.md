# GitHub MCP Server

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Model Context Protocol (MCP) server for GitHub integration. The server provides tools for interacting with the GitHub API, such as searching repositories, getting repository issues, and accessing repository contents.

## SDK Information

You can find more information about the MCP SDK at:
- https://modelcontextprotocol.io
- https://github.com/modelcontextprotocol/sdk

## GitHub API Integration

This server uses Octokit to interact with the GitHub API. The implementation supports both authenticated and unauthenticated access:

- Authenticated access requires a GitHub personal access token passed with each tool call
- Unauthenticated access has limited functionality and rate limits

## Tools Implemented

1. `search-repositories`: Search for GitHub repositories matching a query
2. `get-repository-issues`: Get issues from a GitHub repository
3. `get-repository-contents`: Get the contents of a file or directory in a GitHub repository

When generating code for this project, consider extending it with additional GitHub API capabilities.
