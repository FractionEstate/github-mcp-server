# Contributing to GitHub MCP Server

Thank you for your interest in contributing to the GitHub MCP Server project! This document provides guidelines and instructions for contributing.

## Development Environment Setup

### Prerequisites

- Node.js v24.x or higher
- PNPM v10.x or higher

1. Clone the repository:

   ```bash
   git clone https://github.com/FractionEstate/github-mcp-server.git
   cd github-mcp-server
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm build
   ```

4. Run tests:

   ```bash
   pnpm test
   ```

## Project Structure

- `src/index.ts` - Main entry point for the MCP server
- `src/cardano.ts` - Cardano blockchain interaction functionality
- `src/cardano-node.ts` - Direct Cardano node interaction functionality
- `src/aiken.ts` - Aiken smart contract language tools
- `src/mock-mcp-sdk.ts` - Mock implementation of the MCP SDK

## Adding New Tools

1. Define your new tool in the appropriate file
2. Register it in `src/index.ts` using the MCP server registration pattern
3. Add unit tests in the `__tests__` directory
4. Update documentation in README.md

## GitHub API Authentication

The server supports both authenticated and unauthenticated GitHub API access:

- For authenticated access, users must provide a GitHub personal access token with each tool call
- Unauthenticated access has limited functionality and rate limits

## Code Style

- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Document all public functions and interfaces with JSDoc comments
- Format code with the project's ESLint configuration

## Pull Request Process

1. Create a branch for your feature or bugfix
2. Make your changes and commit them with clear, descriptive messages
3. Run tests and ensure they pass
4. Submit a pull request against the main branch
5. Address any review comments

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT license.
