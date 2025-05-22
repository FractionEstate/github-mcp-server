# GitHub MCP Tools Implementation Guide

This document provides detailed information about the Model Context Protocol (MCP) tools implemented in this server for GitHub and Cardano integrations.

## Tool Structure

All tools in this MCP server follow the same structure:

```typescript
server.tool(
  "tool-name",
  "Tool description",
  {
    // Parameters schema using Zod
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter description"),
  },
  async ({ param1, param2 }) => {
    // Tool implementation
    // Returns content object with text, code, or other data
    return {
      content: [
        {
          type: "text",
          text: "Result text"
        }
      ]
    };
  }
);
```

## GitHub Tools

### 1. search-repositories

Searches for GitHub repositories based on a query string.

**Parameters:**
- `query`: The search query for repositories
- `token` (optional): GitHub personal access token for authenticated requests

**Returns:**
- A list of repositories matching the query, including details such as:
  - Repository name
  - Description
  - Language
  - Stars
  - Forks
  - Open issues count
  - Creation and update dates
  - Clone URL

### 2. get-repository-issues

Retrieves issues from a GitHub repository.

**Parameters:**
- `owner`: Repository owner (username or organization)
- `repo`: Repository name
- `state` (optional): Issue state ("open", "closed", or "all")
- `token` (optional): GitHub personal access token

**Returns:**
- A list of issues from the repository, including details such as:
  - Issue number and title
  - State (open or closed)
  - Creation date and author
  - Comment count
  - Description

### 3. get-repository-contents

Retrieves the contents of a file or directory in a GitHub repository.

**Parameters:**
- `owner`: Repository owner (username or organization)
- `repo`: Repository name
- `path`: File or directory path within the repository
- `ref` (optional): Git reference (branch, tag, or commit SHA)
- `token` (optional): GitHub personal access token

**Returns:**
- For directories: List of files and directories
- For files: File contents and metadata

## Cardano Development Tools

### 4. search-aiken-examples

Searches for Aiken smart contract examples and templates.

**Parameters:**
- `query`: Search term for Aiken smart contract examples

**Returns:**
- List of matching examples with code snippets and descriptions

### 5. get-aiken-docs

Retrieves Aiken language documentation by section.

**Parameters:**
- `section`: Documentation section name (e.g., "basics", "types", "functions")

**Returns:**
- Documentation text for the requested section

### 6. validate-aiken-code

Validates Aiken smart contract code and provides explanations.

**Parameters:**
- `code`: Aiken code to validate

**Returns:**
- Validation results
- Code explanation
- Potential issues or optimizations

## Integration

To use these MCP tools, your client application should connect to this server using the Model Context Protocol. See the [MCP SDK documentation](https://modelcontextprotocol.io) for client implementation details.

## Authentication

Most GitHub API operations can be performed without authentication, but with rate limits. For higher rate limits and access to private repositories, pass a GitHub personal access token with the appropriate scopes.

## Error Handling

All tools implement error handling and provide clear error messages when operations fail. Common error scenarios include:

1. Invalid parameters
2. Authentication failures
3. Rate limiting
4. Resource not found
5. Permission issues

Example error response:

```json
{
  "error": {
    "message": "Resource not found: repository does not exist or is private",
    "code": "not_found"
  }
}
```
