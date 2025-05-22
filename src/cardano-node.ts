// Cardano node specific functions for the GitHub MCP Server

import {
  CardanoNodeConfig,
  executeCardanoCli,
  DEFAULT_CARDANO_CONFIG,
} from "./cardano.js";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as os from "os";
import { exec } from "child_process";
import * as http from "http";
import { createHash } from "crypto";

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);

// Create a temporary directory for transaction files
export async function createTempDir(): Promise<string> {
  const tempDir = path.join(
    os.tmpdir(),
    "cardano-mcp-" + Math.random().toString(36).substring(2, 15)
  );
  await mkdirAsync(tempDir, { recursive: true });
  return tempDir;
}

// Helper function to check if cardano-node is running
export async function isCardanoNodeRunning(
  config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG
): Promise<boolean> {
  try {
    const networkFlag =
      config.network === "mainnet"
        ? "--mainnet"
        : `--testnet-magic ${config.networkMagic}`;
    await executeCardanoCli(["query", "tip", networkFlag], config);
    return true;
  } catch (error: any) {
    return false;
  }
}

// Helper function to get detailed node status
export async function getNodeStatus(
  config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG
): Promise<any> {
  try {
    if (!(await isCardanoNodeRunning(config))) {
      throw new Error("Cardano node is not running or not accessible");
    }

    const networkFlag =
      config.network === "mainnet"
        ? "--mainnet"
        : `--testnet-magic ${config.networkMagic}`;

    // Get the current tip
    const tipOutput = await executeCardanoCli(
      ["query", "tip", networkFlag],
      config
    );
    const tipData = JSON.parse(tipOutput);

    // Get protocol parameters
    const protocolOutput = await executeCardanoCli(
      ["query", "protocol-parameters", networkFlag],
      config
    );
    const protocol = JSON.parse(protocolOutput);

    // Additional system information
    const nodeOutput = await execAsync("ps aux | grep cardano-node").catch(
      () => ({ stdout: "" })
    );
    const nodeProcess = nodeOutput.stdout
      .split("\n")
      .find(
        (line: string) =>
          line.includes("cardano-node") && !line.includes("grep")
      );

    return {
      status: "running",
      tip: tipData,
      network: config.network,
      networkMagic: config.networkMagic,
      socketPath: config.socketPath,
      protocol: {
        minFeeA: protocol.minFeeA,
        minFeeB: protocol.minFeeB,
        maxTxSize: protocol.maxTxSize,
        maxValSize: protocol.maxValSize,
        stakeAddressDeposit: protocol.stakeAddressDeposit,
        epoch: tipData.epoch,
      },
      processInfo: nodeProcess
        ? nodeProcess.trim()
        : "Process info not available",
    };
  } catch (error: any) {
    console.error("Error getting node status:", error);
    throw new Error(`Failed to get Cardano node status: ${error.message}`);
  }
}

// Helper function to generate keys
export async function generateKeys(
  name: string,
  outputDir: string,
  config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG
): Promise<any> {
  try {
    // Create the output directory if it doesn't exist
    await mkdirAsync(outputDir, { recursive: true });

    // Generate payment key pair
    await executeCardanoCli(
      [
        "address",
        "key-gen",
        "--verification-key-file",
        path.join(outputDir, `${name}.vkey`),
        "--signing-key-file",
        path.join(outputDir, `${name}.skey`),
      ],
      config
    );

    // Generate payment address
    const networkFlag =
      config.network === "mainnet"
        ? "--mainnet"
        : `--testnet-magic ${config.networkMagic}`;
    await executeCardanoCli(
      [
        "address",
        "build",
        "--payment-verification-key-file",
        path.join(outputDir, `${name}.vkey`),
        "--out-file",
        path.join(outputDir, `${name}.addr`),
        networkFlag,
      ],
      config
    );

    // Read the generated files
    const vkey = await readFileAsync(
      path.join(outputDir, `${name}.vkey`),
      "utf8"
    );
    const addr = await readFileAsync(
      path.join(outputDir, `${name}.addr`),
      "utf8"
    );

    return {
      name,
      address: addr.trim(),
      verificationKey: JSON.parse(vkey),
      files: {
        vkey: path.join(outputDir, `${name}.vkey`),
        skey: path.join(outputDir, `${name}.skey`),
        addr: path.join(outputDir, `${name}.addr`),
      },
    };
  } catch (error: any) {
    console.error("Error generating keys:", error);
    throw new Error(`Failed to generate keys: ${error.message}`);
  }
}

// Helper function to get transaction details
export async function getTransactionInfo(
  txid: string,
  config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG
): Promise<any> {
  try {
    const networkFlag =
      config.network === "mainnet"
        ? "--mainnet"
        : `--testnet-magic ${config.networkMagic}`;

    // Query the transaction
    try {
      const txInfoOutput = await executeCardanoCli(
        ["query", "tx-info", "--tx-id", txid, networkFlag],
        config
      );

      return JSON.parse(txInfoOutput);
    } catch (error: any) {
      // If tx-info fails (older cardano-cli versions), try to get it from utxo
      console.warn("tx-info command failed, trying alternative approach");

      // This is a simplified implementation
      // In a real implementation, you would want to use a proper indexer
      return {
        txid,
        error: "Transaction not found or tx-info command not supported",
        message:
          "Consider using ogmios, cardano-db-sync, or another indexer for detailed tx info",
      };
    }
  } catch (error: any) {
    console.error(`Error getting transaction info for ${txid}:`, error);
    throw error;
  }
}

// Helper function to get address details including UTXOs
export async function getAddressInfo(
  address: string,
  config: CardanoNodeConfig = DEFAULT_CARDANO_CONFIG
): Promise<any> {
  try {
    const networkFlag =
      config.network === "mainnet"
        ? "--mainnet"
        : `--testnet-magic ${config.networkMagic}`;

    // Query UTXOs at the address using JSON output format
    const utxoOutput = await executeCardanoCli(
      ["query", "utxo", "--address", address, networkFlag, "--output-json"],
      config
    );

    // Parse the JSON output
    const utxoData = JSON.parse(utxoOutput);

    // Process the UTXOs
    const utxos: any[] = [];
    let totalLovelace = 0;
    const assets: Record<string, number> = {};

    // Iterate through UTXOs
    for (const txHash in utxoData) {
      if (Object.prototype.hasOwnProperty.call(utxoData, txHash)) {
        for (const outputIdx in utxoData[txHash]) {
          if (
            Object.prototype.hasOwnProperty.call(utxoData[txHash], outputIdx)
          ) {
            const output = utxoData[txHash][outputIdx];

            // Extract lovelace value
            const lovelaceValue = parseInt(output.value.coin);
            totalLovelace += lovelaceValue;

            // Extract other assets
            if (output.value.assets) {
              for (const assetId in output.value.assets) {
                if (
                  Object.prototype.hasOwnProperty.call(
                    output.value.assets,
                    assetId
                  )
                ) {
                  const amount = parseInt(output.value.assets[assetId]);
                  if (assetId in assets) {
                    assets[assetId] += amount;
                  } else {
                    assets[assetId] = amount;
                  }
                }
              }
            }

            // Add to UTXO list
            utxos.push({
              txId: txHash,
              txIdx: parseInt(outputIdx),
              value: {
                lovelace: lovelaceValue,
                assets: output.value.assets || {},
              },
            });
          }
        }
      }
    }

    return {
      address,
      utxos,
      balance: {
        lovelace: totalLovelace,
        assets,
      },
      ada: totalLovelace / 1000000,
    };
  } catch (error: any) {
    console.error(`Error getting address info for ${address}:`, error);
    throw new Error(`Error getting address info: ${error.message}`);
  }
}

// Helper function to compile and test Aiken contracts
export async function compileAikenContract(contractDir: string): Promise<any> {
  try {
    // Check if Aiken is installed
    try {
      await execAsync("aiken --version");
    } catch (error: any) {
      throw new Error(
        'Aiken CLI is not installed. Please install it with "npm install -g aiken-lang" or follow the instructions at https://aiken-lang.org/'
      );
    }

    // Execute Aiken build command
    const { stdout, stderr } = await execAsync("aiken build", {
      cwd: contractDir,
    });

    if (stderr && stderr.includes("error")) {
      throw new Error(`Aiken build failed: ${stderr}`);
    }

    // Find built contracts
    let plutusFiles: string[] = [];
    try {
      plutusFiles = await promisify(fs.readdir)(
        path.join(contractDir, "build", "plutus")
      );
    } catch (err: any) {
      console.warn("No plutus directory found:", err.message);
      plutusFiles = [];
    }

    const contracts = await Promise.all(
      plutusFiles.map(async (file: string) => {
        const filePath = path.join(contractDir, "build", "plutus", file);
        const content = await readFileAsync(filePath, "utf8");
        return {
          name: file.replace(".json", ""),
          path: filePath,
          contract: JSON.parse(content),
        };
      })
    );

    return {
      success: true,
      buildOutput: stdout,
      contracts,
    };
  } catch (error: any) {
    console.error("Error compiling Aiken contract:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
