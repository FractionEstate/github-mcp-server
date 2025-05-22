# Cardano Development Tools

This document provides detailed information about the Cardano blockchain development tools implemented in this MCP server.

## Cardano Blockchain Tools

### 1. get-cardano-blockchain-info

Retrieves information about Cardano blocks, transactions, addresses, and network statistics.

**Parameters:**
- `type`: Type of information to retrieve ("block", "transaction", "address", "network")
- `identifier` (optional): Block hash, transaction hash, or address
- `network` (optional): Cardano network ("mainnet", "testnet", "preview") - defaults to "mainnet"

**Returns:**
- For blocks: Block details including height, hash, slot, epoch, and transactions
- For transactions: Transaction details including inputs, outputs, and metadata
- For addresses: Address balance, stake information, and transaction history
- For network: Current network statistics

### 2. get-cardano-token-info

Retrieves information about Cardano native tokens.

**Parameters:**
- `policyId`: Token policy ID
- `assetName` (optional): Asset name within the policy (if omitted, returns all assets under the policy)
- `network` (optional): Cardano network ("mainnet", "testnet", "preview") - defaults to "mainnet"

**Returns:**
- Token information including metadata, supply, and holder details

## Cardano Node Tools

### 3. check-cardano-node

Checks the status of a running Cardano node.

**Parameters:**
- `socketPath` (optional): Path to the Cardano node socket 
- `network` (optional): Cardano network ("mainnet", "testnet", "preview")

**Returns:**
- Node status including sync status, connected peers, and current blockchain tip

### 4. generate-cardano-keys

Generates Cardano address and keys.

**Parameters:**
- `type`: Key type ("payment", "stake", "policy")
- `network` (optional): Cardano network ("mainnet", "testnet") - defaults to "testnet"

**Returns:**
- Generated keys and addresses

### 5. query-cardano-address

Queries UTXOs and balance for a Cardano address.

**Parameters:**
- `address`: Cardano address to query
- `network` (optional): Cardano network ("mainnet", "testnet", "preview")

**Returns:**
- List of UTXOs at the address
- Total balance (lovelace and native tokens)

### 6. compile-aiken-contract

Compiles an Aiken smart contract.

**Parameters:**
- `code`: Aiken contract source code
- `outputFormat` (optional): Output format ("plutus", "cbor", "hex") - defaults to "plutus"

**Returns:**
- Compiled contract
- Validation success/error messages
- Contract hash

## Integration with Cardano Node

This server can interact directly with a Cardano node for advanced operations. To use node-specific functionality:

1. Ensure a Cardano node is running and accessible
2. Set the `CARDANO_NODE_SOCKET_PATH` environment variable to the node's socket path
3. Set the `CARDANO_NETWORK` environment variable to the target network

Example configuration:

```bash
export CARDANO_NODE_SOCKET_PATH=/ipc/node.socket
export CARDANO_NETWORK=testnet
```

## Aiken Smart Contract Development

[Aiken](https://aiken-lang.org/) is a smart contract language for the Cardano blockchain. This server provides tools to help with Aiken development:

1. **search-aiken-examples**: Find example code snippets
2. **get-aiken-docs**: Access language documentation
3. **validate-aiken-code**: Check code validity and get explanations
4. **compile-aiken-contract**: Compile Aiken to Plutus

## Error Handling

Common error scenarios for Cardano tools include:

1. Node unavailable or not synced
2. Invalid addresses or transaction hashes
3. Compilation errors in smart contracts
4. Network connectivity issues

Example error response:

```json
{
  "error": {
    "message": "Cardano node not available at specified socket path",
    "code": "node_unavailable"
  }
}
```

## Resources

- [Cardano Developer Portal](https://developers.cardano.org/)
- [Aiken Documentation](https://aiken-lang.org/)
