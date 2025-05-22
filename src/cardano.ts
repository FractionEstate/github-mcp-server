// Cardano functionality for the GitHub MCP Server

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Cardano node connection settings
export interface CardanoNodeConfig {
  socketPath?: string;  // Path to cardano-node socket
  networkMagic?: number; // Network magic number
  network?: 'mainnet' | 'testnet' | 'preview'; // Network name
  nodePath?: string;    // Path to cardano-node executable
  cliPath?: string;     // Path to cardano-cli executable
  era?: string;         // Cardano era (e.g., 'babbage', 'conway')
}

// Default configuration (user can override these)
export const DEFAULT_CARDANO_CONFIG: CardanoNodeConfig = {
  socketPath: process.env.CARDANO_NODE_SOCKET_PATH || '/ipc/node.socket',
  network: 'mainnet',
  networkMagic: 764824073, // Mainnet magic
  cliPath: 'cardano-cli',
  era: 'conway'
};

// Helper function to format Aiken contract information
export function formatAikenContract(contract: any): string {
  return `
Contract Name: ${contract.name || 'Unnamed'}
Description: ${contract.description || 'No description provided'}
Version: ${contract.version || 'Not specified'}
Validation Functions: ${(contract.validators || []).map((v: any) => v.name).join(', ') || 'None specified'}
Parameters: ${(contract.parameters || []).map((p: any) => `${p.name}: ${p.type}`).join(', ') || 'None specified'}
`.trim();
}

// Helper function to format Cardano block information
export function formatBlockInfo(block: any): string {
  return `
Block: ${block.hash || block.id}
Height: ${block.number || block.height}
Slot: ${block.slot || 'Not specified'}
Epoch: ${block.epoch || block.epoch_no || 'Not specified'}
Time: ${block.forgedAt ? new Date(block.forgedAt).toLocaleString() : (block.time ? new Date(block.time * 1000).toLocaleString() : 'Unknown')}
Size: ${block.size || 'Unknown'} bytes
Transactions: ${block.transactionsCount || block.tx_count || 'Unknown'}
`.trim();
}

// Helper function to format Cardano transaction information
export function formatTransactionInfo(tx: any): string {
  return `
Transaction: ${tx.hash || tx.id}
Block: ${tx.block?.number || tx.block?.hash || tx.block_height || 'Unknown'}
Fee: ${tx.fee ? `${tx.fee / 1000000} ADA` : 'Unknown'}
Size: ${tx.size || 'Unknown'} bytes
Inputs: ${tx.inputsCount || (tx.inputs ? tx.inputs.length : 'Unknown')}
Outputs: ${tx.outputsCount || (tx.outputs ? tx.outputs.length : 'Unknown')}
Total Output: ${tx.totalOutput ? `${tx.totalOutput / 1000000} ADA` : (tx.output_amount ? `${tx.output_amount.quantity / 1000000} ADA` : 'Unknown')}
Time: ${tx.includedAt ? new Date(tx.includedAt).toLocaleString() : (tx.time ? new Date(tx.time * 1000).toLocaleString() : 'Unknown')}
`.trim();
}

// Helper function to execute cardano-cli commands
export async function executeCardanoCli(args: string[], config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG): Promise<string> {
  try {
    const cliPath = config.cliPath || 'cardano-cli';
    const cmd = `${cliPath} ${args.join(' ')}`;

    // Set CARDANO_NODE_SOCKET_PATH environment for CLI commands
    const env = {
      ...process.env,
      CARDANO_NODE_SOCKET_PATH: config.socketPath
    };

    console.log(`Executing: ${cmd}`);
    const { stdout, stderr } = await execAsync(cmd, { env });

    if (stderr) {
      console.error(`cardano-cli stderr: ${stderr}`);
    }

    return stdout.trim();
  } catch (error) {
    console.error(`Error executing cardano-cli:`, error);
    throw error;
  }
}

// Helper function to get a token's metadata using cardano-cli
export async function getTokenMetadata(policyId: string, assetName: string, config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG): Promise<any> {
  try {
    // Attempt to use cardano-cli query utxo to find assets with this policy ID
    const networkFlag = config.network === 'mainnet' ? '--mainnet' : `--testnet-magic ${config.networkMagic}`;

    // Query the tip first to ensure we're connected
    const tip = await executeCardanoCli(['query', 'tip', networkFlag], config);
    console.log(`Current tip: ${tip}`);

    // Use kupo or other indexers for asset queries if available
    // This is a simplified implementation
    // In a production environment, you would want to use a proper indexer

    // For token registry info, we can still use the token registry API
    const tokenRegistryResponse = await axios.get(
      `https://tokens.cardano.org/metadata/${policyId}${assetName || ''}`
    ).catch(() => ({ data: null }));

    return {
      policyId,
      assetName,
      registryMetadata: tokenRegistryResponse.data,
      networkInfo: JSON.parse(tip)
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw error;
  }
}

// Helper function to get Cardano network statistics
export async function getNetworkStats(config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG): Promise<any> {
  try {
    // Use network flag based on configuration
    const networkFlag = config.network === 'mainnet' ? '--mainnet' : `--testnet-magic ${config.networkMagic}`;

    // Query the current tip
    const tipOutput = await executeCardanoCli(['query', 'tip', networkFlag], config);
    const tip = JSON.parse(tipOutput);

    // Query protocol parameters
    const protoOutput = await executeCardanoCli(['query', 'protocol-parameters', networkFlag], config);
    const protocol = JSON.parse(protoOutput);

    // Construct a result similar to what we'd get from Blockfrost
    return {
      tip,
      protocol,
      network: config.network,
      cardanoEra: config.era
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    throw error;
  }
}

// Helper function to search for Aiken smart contract templates/examples on GitHub
export async function searchAikenExamples(query: string, token?: string): Promise<any[]> {
  try {
    const searchQuery = `${query} language:aiken`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'github-mcp-server',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await axios.get('https://api.github.com/search/code', {
      headers,
      params: {
        q: searchQuery,
        per_page: 10,
      }
    });

    return response.data.items;
  } catch (error) {
    console.error('Error searching for Aiken examples:', error);
    throw error;
  }
}

// Helper function to query Cardano node directly instead of using GraphQL
export async function queryCardanoNode(queryType: string, parameters: string[] = [], config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG): Promise<any> {
  try {
    const networkFlag = config.network === 'mainnet' ? '--mainnet' : `--testnet-magic ${config.networkMagic}`;

    let result;
    switch(queryType) {
      case 'tip':
        result = await executeCardanoCli(['query', 'tip', networkFlag], config);
        return JSON.parse(result);

      case 'utxo':
        const address = parameters[0];
        if (!address) throw new Error('Address is required for utxo query');
        result = await executeCardanoCli(['query', 'utxo', '--address', address, networkFlag], config);
        return parseCliTableOutput(result);

      case 'protocol-parameters':
        result = await executeCardanoCli(['query', 'protocol-parameters', networkFlag], config);
        return JSON.parse(result);

      case 'stake-distribution':
        result = await executeCardanoCli(['query', 'stake-distribution', networkFlag], config);
        return parseCliTableOutput(result);

      case 'stake-address-info':
        const stakeAddr = parameters[0];
        if (!stakeAddr) throw new Error('Stake address is required');
        result = await executeCardanoCli(['query', 'stake-address-info', '--address', stakeAddr, networkFlag], config);
        return JSON.parse(result);

      case 'ledger-state':
        result = await executeCardanoCli(['query', 'ledger-state', networkFlag], config);
        return JSON.parse(result);

      default:
        throw new Error(`Unsupported query type: ${queryType}`);
    }
  } catch (error) {
    console.error(`Error querying Cardano node (${queryType}):`, error);
    throw error;
  }
}

// Helper function to parse tabular CLI output into structured data
function parseCliTableOutput(output: string): any[] {
  const lines = output.trim().split('\n');
  if (lines.length <= 1) return [];

  // Skip header line if present
  const dataLines = lines.slice(1);
  return dataLines.map(line => {
    const columns = line.split(/\s+/).filter(Boolean);
    // This is a simplified parser - in a real implementation,
    // you would want to parse according to the specific output format
    return {
      raw: line,
      columns
    };
  });
}
