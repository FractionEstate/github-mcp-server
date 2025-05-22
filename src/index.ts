// GitHub MCP Server with Cardano development capabilities
// Using mock SDK to resolve import issues
import { McpServer, StdioServerTransport } from "./mock-mcp-sdk.js";
import { z } from "zod";
import { Octokit } from "octokit";
import axios from "axios";

// Import Cardano functionality
import {
  formatAikenContract,
  formatBlockInfo,
  formatTransactionInfo,
  getTokenMetadata,
  getNetworkStats,
  searchAikenExamples,
  queryCardanoNode,
  CardanoNodeConfig,
  DEFAULT_CARDANO_CONFIG,
  executeCardanoCli,
} from "./cardano.js";

// Import Cardano node specific functionality
import {
  isCardanoNodeRunning,
  getNodeStatus,
  generateKeys,
  getTransactionInfo,
  getAddressInfo,
  compileAikenContract,
} from "./cardano-node.js";

// Import Aiken functionality
import {
  AIKEN_DOCS_SECTIONS,
  getAikenDocumentation,
  getAikenExamples,
  formatAikenCodeExplanation,
  isValidAikenSyntax,
} from "./aiken.js";

// GitHub API integration
const GITHUB_API_BASE = "https://api.github.com";
// Cardano API integration endpoints
const BLOCKFROST_API_BASE = "https://cardano-mainnet.blockfrost.io/api/v0";

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
Description: ${repo.description || "No description provided"}
Language: ${repo.language || "Not specified"}
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
Created: ${new Date(issue.created_at).toLocaleDateString()} by ${
    issue.user.login
  }
Comments: ${issue.comments}
${issue.body ? `\nDescription:\n${issue.body}` : ""}
`.trim();
}

// Register GitHub tools
// 1. Search repositories tool
server.tool(
  "search-repositories",
  "Search for GitHub repositories matching a query",
  {
    query: z.string().describe("Search query for repositories"),
    token: z
      .string()
      .optional()
      .describe("GitHub personal access token (optional)"),
  },
  async ({ query, token }: { query: string; token?: string }) => {
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
      const resultsText = `Found ${
        response.data.total_count
      } repositories matching "${query}". Here are the top results:\n\n${reposInfo.join(
        "\n\n---\n\n"
      )}`;

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
    state: z
      .enum(["open", "closed", "all"])
      .default("open")
      .describe("Issue state filter"),
    token: z
      .string()
      .optional()
      .describe("GitHub personal access token (optional)"),
  },
  async ({
    owner,
    repo,
    state,
    token,
  }: {
    owner: string;
    repo: string;
    state: "open" | "closed" | "all";
    token?: string;
  }) => {
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
      const resultsText = `Found ${
        issues.length
      } ${state} issues in repository ${owner}/${repo}:\n\n${issuesInfo.join(
        "\n\n---\n\n"
      )}`;

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
            text: `Error getting repository issues: ${
              (error as Error).message
            }`,
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
    token: z
      .string()
      .optional()
      .describe("GitHub personal access token (optional)"),
  },
  async ({
    owner,
    repo,
    path,
    token,
  }: {
    owner: string;
    repo: string;
    path: string;
    token?: string;
  }) => {
    try {
      const client = token ? new Octokit({ auth: token }) : octokit;

      const response = await client.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      // Handle directory listings
      if (Array.isArray(response.data)) {
        const files = response.data.map(
          (item: any) => `${item.name} (${item.type})`
        );
        return {
          content: [
            {
              type: "text",
              text: `Directory contents of ${path} in ${owner}/${repo}:\n\n${files.join(
                "\n"
              )}`,
            },
          ],
        };
      }

      // Handle file content
      if ("content" in response.data && response.data.encoding === "base64") {
        const content = Buffer.from(response.data.content, "base64").toString(
          "utf-8"
        );
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
            text: `Error getting repository contents: ${
              (error as Error).message
            }`,
          },
        ],
      };
    }
  }
);

// 4. Search for Aiken smart contract examples
server.tool(
  "search-aiken-examples",
  "Search for Aiken smart contract examples and templates on GitHub",
  {
    query: z
      .string()
      .describe("Search query for Aiken smart contract examples"),
    token: z
      .string()
      .optional()
      .describe("GitHub personal access token (optional)"),
  },
  async ({ query, token }: { query: string; token?: string }) => {
    try {
      // First try to search in official Aiken repositories
      const aikenExamples = await getAikenExamples(query, token);

      // Then expand search to other GitHub repositories
      const otherExamples = await searchAikenExamples(query, token);

      if (aikenExamples.length === 0 && otherExamples.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No Aiken smart contract examples found matching "${query}"`,
            },
          ],
        };
      }

      let resultsText = `Found Aiken smart contract examples matching "${query}":\n\n`;

      // Format official examples
      if (aikenExamples.length > 0) {
        resultsText += "## Official Examples\n\n";
        for (const example of aikenExamples) {
          resultsText += `### ${example.name}\n`;
          resultsText += `Path: ${example.path}\n`;
          if (example.html_url) {
            resultsText += `URL: ${example.html_url}\n`;
          }
          resultsText += "\n";
        }
      }

      // Format other GitHub examples
      if (otherExamples.length > 0) {
        resultsText += "## Community Examples\n\n";
        for (const example of otherExamples) {
          resultsText += `### ${example.name}\n`;
          resultsText += `Repository: ${
            example.repository?.full_name || "Unknown"
          }\n`;
          resultsText += `Path: ${example.path}\n`;
          if (example.html_url) {
            resultsText += `URL: ${example.html_url}\n`;
          }
          resultsText += "\n";
        }
      }

      return {
        content: [
          {
            type: "text",
            text: resultsText,
          },
        ],
      };
    } catch (error) {
      console.error("Error searching for Aiken examples:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error searching for Aiken examples: ${
              (error as Error).message
            }`,
          },
        ],
      };
    }
  }
);

// 5. Get Aiken documentation
server.tool(
  "get-aiken-docs",
  "Get Aiken language documentation",
  {
    section: z
      .string()
      .describe(
        "Documentation section (e.g., 'installation', 'language-tour', 'stdlib', 'type-system', etc.)"
      ),
    token: z
      .string()
      .optional()
      .describe("GitHub personal access token (optional)"),
  },
  async ({ section, token }: { section: string; token?: string }) => {
    try {
      // Get documentation content for the specified section
      const docContent = await getAikenDocumentation(section, token);

      return {
        content: [
          {
            type: "text",
            text: `# Aiken Documentation: ${section}\n\n${docContent}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error getting Aiken documentation:", error);

      // If section not found, suggest available sections
      return {
        content: [
          {
            type: "text",
            text: `Error getting Aiken documentation: ${
              (error as Error).message
            }\n\nAvailable documentation sections: ${AIKEN_DOCS_SECTIONS.join(
              ", "
            )}`,
          },
        ],
      };
    }
  }
);

// 6. Validate Aiken code
server.tool(
  "validate-aiken-code",
  "Validate Aiken smart contract code syntax",
  {
    code: z.string().describe("Aiken code to validate"),
  },
  async ({ code }: { code: string }) => {
    try {
      // Check if the code appears to be valid Aiken syntax
      const validationResult = isValidAikenSyntax(code);

      if (validationResult.valid) {
        // If valid, analyze the code structure
        const codeExplanation = formatAikenCodeExplanation(code);

        return {
          content: [
            {
              type: "text",
              text: `✅ The Aiken code appears to be valid.\n\n${codeExplanation}`,
            },
          ],
        };
      } else {
        // If not valid, return the errors
        return {
          content: [
            {
              type: "text",
              text: `❌ The Aiken code has potential syntax issues:\n\n${validationResult
                .errors!.map((err) => `- ${err}`)
                .join("\n")}\n\nPlease review and correct these issues.`,
            },
          ],
        };
      }
    } catch (error) {
      console.error("Error validating Aiken code:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error validating Aiken code: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);

// 7. Get Cardano blockchain information
server.tool(
  "get-cardano-blockchain-info",
  "Get Cardano blockchain information (blocks, transactions, etc.)",
  {
    type: z
      .enum(["block", "transaction", "address", "network", "node"])
      .describe("Type of information to retrieve"),
    identifier: z
      .string()
      .optional()
      .describe(
        "Block hash/number, transaction hash, or address (if applicable)"
      ),
    nodeConfig: z
      .object({
        socketPath: z.string().optional(),
        networkMagic: z.number().optional(),
        network: z.enum(["mainnet", "testnet", "preview"]).optional(),
        cliPath: z.string().optional(),
        era: z.string().optional(),
      })
      .optional()
      .describe("Cardano node configuration (optional)"),
  },
  async ({
    type,
    identifier,
    nodeConfig,
  }: {
    type: "block" | "transaction" | "address" | "network" | "node";
    identifier?: string;
    nodeConfig?: {
      socketPath?: string;
      networkMagic?: number;
      network?: "mainnet" | "testnet" | "preview";
      cliPath?: string;
      era?: string;
    };
  }) => {
    try {
      // Use provided node config or default
      const config: CardanoNodeConfig = {
        ...DEFAULT_CARDANO_CONFIG,
        ...nodeConfig,
      };
      switch (type) {
        case "network": {
          // Get general network statistics
          const stats = await getNetworkStats();

          return {
            content: [
              {
                type: "text",
                text: `## Cardano Network Information\n\nSupply: ${
                  stats.supply.circulating / 1000000
                } ADA\nStake: ${stats.stake.active / 1000000} ADA\nEpoch: ${
                  stats.epoch
                }\nSlot: ${stats.slot}\nLatest Block: ${
                  stats.latest_block.height
                } (${stats.latest_block.hash})\nLatest Block Time: ${new Date(
                  stats.latest_block.time * 1000
                ).toLocaleString()}\n`,
              },
            ],
          };
        }

        case "block": {
          if (!identifier) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Block identifier (hash or number) is required",
                },
              ],
            };
          }

          // Get block information by hash or number
          const headers: Record<string, string> = {};

          let endpoint = "";
          if (/^[0-9]+$/.test(identifier)) {
            // If identifier is a number (block height)
            endpoint = `${BLOCKFROST_API_BASE}/blocks/slot/${identifier}`;
          } else {
            // If identifier is a hash
            endpoint = `${BLOCKFROST_API_BASE}/blocks/${identifier}`;
          }

          const response = await axios.get(endpoint, { headers });
          const blockInfo = formatBlockInfo(response.data);

          return {
            content: [
              {
                type: "text",
                text: `## Cardano Block Information\n\n${blockInfo}`,
              },
            ],
          };
        }

        case "transaction": {
          if (!identifier) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Transaction hash is required",
                },
              ],
            };
          }

          // Get transaction information
          const headers: Record<string, string> = {};

          const endpoint = `${BLOCKFROST_API_BASE}/txs/${identifier}`;
          const response = await axios.get(endpoint, { headers });
          const txInfo = formatTransactionInfo(response.data);

          return {
            content: [
              {
                type: "text",
                text: `## Cardano Transaction Information\n\n${txInfo}`,
              },
            ],
          };
        }

        case "address": {
          if (!identifier) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Address is required",
                },
              ],
            };
          }

          // Get address information
          const headers: Record<string, string> = {};

          const endpoint = `${BLOCKFROST_API_BASE}/addresses/${identifier}`;
          const response = await axios.get(endpoint, { headers });

          const addressInfo = `
Address: ${identifier}
Total ADA: ${
            response.data.amount.find((a: any) => a.unit === "lovelace")
              ?.quantity / 1000000 || 0
          } ADA
Total Assets: ${response.data.amount.length - 1} different assets
`.trim();

          return {
            content: [
              {
                type: "text",
                text: `## Cardano Address Information\n\n${addressInfo}`,
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: `Error: Unsupported information type: ${type}`,
              },
            ],
          };
      }
    } catch (error) {
      console.error("Error getting Cardano blockchain information:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting Cardano blockchain information: ${
              (error as Error).message
            }`,
          },
        ],
      };
    }
  }
);

// 8. Get token information
server.tool(
  "get-cardano-token-info",
  "Get information about a Cardano native token",
  {
    policyId: z.string().describe("The policy ID of the token"),
    assetName: z
      .string()
      .optional()
      .describe("The asset name (hex encoded, optional)"),
  },
  async ({
    policyId,
    assetName = "",
  }: {
    policyId: string;
    assetName?: string;
  }) => {
    try {
      // Get token metadata
      const tokenData = await getTokenMetadata(policyId, assetName);

      let tokenInfo = `
Policy ID: ${tokenData.policy_id}
Asset Name: ${
        tokenData.asset_name
          ? Buffer.from(tokenData.asset_name, "hex").toString("utf-8")
          : "N/A"
      }
Fingerprint: ${tokenData.fingerprint}
Total Supply: ${tokenData.quantity}
`.trim();

      // Add metadata if available
      if (tokenData.onchain_metadata) {
        tokenInfo += "\n\nOn-chain Metadata:\n";
        for (const [key, value] of Object.entries(tokenData.onchain_metadata)) {
          tokenInfo += `${key}: ${JSON.stringify(value)}\n`;
        }
      } else if (tokenData.metadata) {
        tokenInfo += "\n\nOff-chain Metadata:\n";
        for (const [key, value] of Object.entries(tokenData.metadata)) {
          tokenInfo += `${key}: ${JSON.stringify(value)}\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `## Cardano Token Information\n\n${tokenInfo}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error getting token information:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting token information: ${
              (error as Error).message
            }`,
          },
        ],
      };
    }
  }
);

// 9. Cardano Node Status Tool
server.tool(
  "check-cardano-node",
  "Get status and information about a running Cardano node",
  {
    nodeConfig: z
      .object({
        socketPath: z
          .string()
          .optional()
          .describe("Path to cardano-node socket"),
        networkMagic: z.number().optional().describe("Network magic number"),
        network: z
          .enum(["mainnet", "testnet", "preview"])
          .optional()
          .describe("Network name"),
        cliPath: z
          .string()
          .optional()
          .describe("Path to cardano-cli executable"),
        era: z.string().optional().describe("Cardano era"),
      })
      .optional()
      .describe("Cardano node configuration"),
  },
  async ({
    nodeConfig,
  }: {
    nodeConfig?: {
      socketPath?: string;
      networkMagic?: number;
      network?: "mainnet" | "testnet" | "preview";
      cliPath?: string;
      era?: string;
    };
  }) => {
    try {
      // Use provided node config or default
      const config = {
        ...DEFAULT_CARDANO_CONFIG,
        ...nodeConfig,
      };

      // Check if node is running
      const isRunning = await isCardanoNodeRunning(config);

      if (!isRunning) {
        return {
          content: [
            {
              type: "text",
              text: `## Cardano Node Status\n\nCardano node is not running or not accessible at socket path: ${config.socketPath}\n\nPlease make sure the node is running and the CARDANO_NODE_SOCKET_PATH environment variable is set correctly.`,
            },
          ],
        };
      }

      // Get detailed node status
      const status = await getNodeStatus(config);

      // Format the response
      return {
        content: [
          {
            type: "text",
            text: `## Cardano Node Status\n\nStatus: Running\nNetwork: ${
              status.network
            }\nEra: ${status.protocol.era || config.era}\nEpoch: ${
              status.tip.epoch
            }\nBlock: ${status.tip.block}\nSlot: ${status.tip.slot}\nHash: ${
              status.tip.hash
            }\nSync Progress: 100%\n\n### Protocol Parameters\n\nMin Fee A: ${
              status.protocol.minFeeA
            }\nMin Fee B: ${status.protocol.minFeeB}\nMax Tx Size: ${
              status.protocol.maxTxSize
            } bytes\nMax Val Size: ${
              status.protocol.maxValSize || "N/A"
            }\nStake Address Deposit: ${
              status.protocol.stakeAddressDeposit / 1000000
            } ₳\n\n### Process Information\n\n${status.processInfo}`,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error checking cardano node status:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error checking Cardano node status: ${error.message}\n\nPlease ensure your node is running and properly configured.`,
          },
        ],
      };
    }
  }
);

// 10. Generate Cardano Keys
server.tool(
  "generate-cardano-keys",
  "Generate Cardano address and keys",
  {
    name: z.string().describe("Name prefix for the keys"),
    outputDir: z
      .string()
      .optional()
      .describe("Output directory path (defaults to ./keys)"),
    nodeConfig: z
      .object({
        socketPath: z.string().optional(),
        networkMagic: z.number().optional(),
        network: z.enum(["mainnet", "testnet", "preview"]).optional(),
        cliPath: z.string().optional(),
      })
      .optional(),
  },
  async ({
    name,
    outputDir = "./keys",
    nodeConfig,
  }: {
    name: string;
    outputDir?: string;
    nodeConfig?: {
      socketPath?: string;
      networkMagic?: number;
      network?: "mainnet" | "testnet" | "preview";
      cliPath?: string;
    };
  }) => {
    try {
      // Use provided node config or default
      const config = {
        ...DEFAULT_CARDANO_CONFIG,
        ...nodeConfig,
      };

      // Check if node is running
      if (!(await isCardanoNodeRunning(config))) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Cardano node is not running or not accessible. Please make sure the node is running and the CARDANO_NODE_SOCKET_PATH environment variable is set correctly.",
            },
          ],
        };
      }

      // Generate keys
      const keys = await generateKeys(name, outputDir, config);

      return {
        content: [
          {
            type: "text",
            text: `## Cardano Keys Generated\n\nName: ${keys.name}\nAddress: ${keys.address}\n\nFiles created:\n- Verification Key: ${keys.files.vkey}\n- Signing Key: ${keys.files.skey}\n- Address: ${keys.files.addr}\n\nKeep your signing key secure and don't share it with anyone!`,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error generating Cardano keys:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error generating Cardano keys: ${error.message}`,
          },
        ],
      };
    }
  }
);

// 11. Query Cardano Address
server.tool(
  "query-cardano-address",
  "Get UTXOs and balance for a Cardano address",
  {
    address: z.string().describe("Cardano address to query"),
    nodeConfig: z
      .object({
        socketPath: z.string().optional(),
        networkMagic: z.number().optional(),
        network: z.enum(["mainnet", "testnet", "preview"]).optional(),
        cliPath: z.string().optional(),
      })
      .optional(),
  },
  async ({
    address,
    nodeConfig,
  }: {
    address: string;
    nodeConfig?: {
      socketPath?: string;
      networkMagic?: number;
      network?: "mainnet" | "testnet" | "preview";
      cliPath?: string;
    };
  }) => {
    try {
      // Use provided node config or default
      const config = {
        ...DEFAULT_CARDANO_CONFIG,
        ...nodeConfig,
      };

      // Check if node is running
      if (!(await isCardanoNodeRunning(config))) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Cardano node is not running or not accessible. Please make sure the node is running and the CARDANO_NODE_SOCKET_PATH environment variable is set correctly.",
            },
          ],
        };
      }

      // Get address info
      const addressInfo = await getAddressInfo(address, config);

      // Format assets
      let assetsText = "";
      if (addressInfo.balance.assets) {
        for (const [assetId, amount] of Object.entries(
          addressInfo.balance.assets
        )) {
          assetsText += `- ${assetId}: ${amount}\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `## Cardano Address Information\n\nAddress: ${address}\nBalance: ${
              addressInfo.ada
            } ₳ (${addressInfo.balance.lovelace} lovelace)\nUTXO Count: ${
              addressInfo.utxos.length
            }\n\n${assetsText ? `### Native Assets\n\n${assetsText}` : ""}`,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error querying Cardano address:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error querying Cardano address: ${error.message}`,
          },
        ],
      };
    }
  }
);

// 12. Compile Aiken Smart Contract
server.tool(
  "compile-aiken-contract",
  "Compile an Aiken smart contract",
  {
    contractDir: z.string().describe("Directory containing the Aiken contract"),
    outputDir: z
      .string()
      .optional()
      .describe("Output directory for compiled contract"),
  },
  async ({
    contractDir,
    outputDir = "./plutus",
  }: {
    contractDir: string;
    outputDir?: string;
  }) => {
    try {
      // Compile the contract
      const result = await compileAikenContract(contractDir);

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to compile Aiken contract: ${result.error}`,
            },
          ],
        };
      }

      // Format the contracts info
      let contractsText = "";
      for (const contract of result.contracts) {
        contractsText += `### ${contract.name}\n\n- Path: ${
          contract.path
        }\n- Validators: ${contract.contract.validators?.length || 0}\n\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: `## Aiken Contract Compilation Successful\n\nCompiled ${result.contracts.length} contract(s)\n\n${contractsText}\n\nOutput:\n\n\`\`\`\n${result.buildOutput}\n\`\`\``,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error compiling Aiken contract:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error compiling Aiken contract: ${error.message}`,
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
  console.error("GitHub MCP Server with Cardano capabilities running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
