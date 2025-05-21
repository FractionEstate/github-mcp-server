// GitHub MCP Server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Octokit } from "octokit";

// GitHub API integration
const GITHUB_API_BASE = "https://api.github.com";

// Create server instance
const server = new McpServer({
  name: "github-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Initialize Octokit for GitHub API access
// Note: This will use the GITHUB_TOKEN environment variable if set
// Otherwise, it will have limited access to public repositories
const octokit = new Octokit();

// Helper function to validate GitHub tokens
async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.users.getAuthenticated();
    return true;
  } catch (error) {
    console.error("Error validating GitHub token:", error);
    return false;
  }
}

// Helper function to format repository data
function formatRepoInfo(repo: any): string {
  return `
Repository: ${repo.full_name}
Description: ${repo.description || 'No description provided'}
Language: ${repo.language || 'Not specified'}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}
Open Issues: ${repo.open_issues_count}
Created: ${new Date(repo.created_at).toLocaleDateString()}
Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}
Clone URL: ${repo.clone_url}
`.trim();
}

// Helper function to format issue data
function formatIssue(issue: any): string {
  return `
Issue #${issue.number}: ${issue.title}
State: ${issue.state}
Created: ${new Date(issue.created_at).toLocaleDateString()} by ${issue.user.login}
Comments: ${issue.comments}
${issue.body ? `\nDescription:\n${issue.body}` : ''}
`.trim();
}

// Register GitHub tools
// 1. Search repositories tool
server.tool(
  "search-repositories",
  "Search for GitHub repositories matching a query",
  {
    query: z.string().describe("Search query for repositories"),
    token: z.string().optional().describe("GitHub personal access token (optional)"),
  },
  async ({ query, token }) => {
    try {
      const client = token ? new Octokit({ auth: token }) : octokit;

      const response = await client.rest.search.repos({
        q: query,
        sort: "stars",
        order: "desc",
        per_page: 5,
      });

      const repos = response.data.items;
      if (repos.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No repositories found matching "${query}"`,
            },
          ],
        };
      }

      const reposInfo = repos.map(formatRepoInfo);
      const resultsText = `Found ${response.data.total_count} repositories matching "${query}". Here are the top results:\n\n${reposInfo.join("\n\n---\n\n")}`;

      return {
        content: [
          {
            type: "text",
            text: resultsText,
          },
        ],
      };
    } catch (error) {
      console.error("Error searching repositories:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error searching repositories: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 2. Get repository issues tool
server.tool(
  "get-repository-issues",
  "Get issues from a GitHub repository",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    state: z.enum(["open", "closed", "all"]).default("open").describe("Issue state filter"),
    token: z.string().optional().describe("GitHub personal access token (optional)"),
  },
  async ({ owner, repo, state, token }) => {
    try {
      const client = token ? new Octokit({ auth: token }) : octokit;

      const response = await client.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 10,
      });

      const issues = response.data;
      if (issues.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No ${state} issues found in repository ${owner}/${repo}`,
            },
          ],
        };
      }

      const issuesInfo = issues.map(formatIssue);
      const resultsText = `Found ${issues.length} ${state} issues in repository ${owner}/${repo}:\n\n${issuesInfo.join("\n\n---\n\n")}`;

      return {
        content: [
          {
            type: "text",
            text: resultsText,
          },
        ],
      };
    } catch (error) {
      console.error("Error getting repository issues:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting repository issues: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 3. Get repository contents tool
server.tool(
  "get-repository-contents",
  "Get the contents of a file in a GitHub repository",
  {
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    path: z.string().describe("Path to the file or directory"),
    token: z.string().optional().describe("GitHub personal access token (optional)"),
  },
  async ({ owner, repo, path, token }) => {
    try {
      const client = token ? new Octokit({ auth: token }) : octokit;

      const response = await client.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      // Handle directory listings
      if (Array.isArray(response.data)) {
        const files = response.data.map((item: any) => `${item.name} (${item.type})`);
        return {
          content: [
            {
              type: "text",
              text: `Directory contents of ${path} in ${owner}/${repo}:\n\n${files.join('\n')}`,
            },
          ],
        };
      }

      // Handle file content
      if ('content' in response.data && response.data.encoding === 'base64') {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return {
          content: [
            {
              type: "text",
              text: `File: ${path} in ${owner}/${repo}:\n\n${content}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Unable to display content for this type of file or directory`,
          },
        ],
      };
    } catch (error) {
      console.error("Error getting repository contents:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting repository contents: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// Run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
