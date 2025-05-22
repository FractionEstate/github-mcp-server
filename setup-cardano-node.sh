#!/bin/bash
# Script to prepare configuration for running a Cardano node

set -e

NETWORK=${1:-testnet}
CONFIG_DIR="./cardano-config"

echo "Setting up Cardano $NETWORK configuration..."

# Create config directory if it doesn't exist
mkdir -p $CONFIG_DIR

if [ "$NETWORK" = "mainnet" ]; then
  echo "Downloading mainnet configuration files..."
  curl -o $CONFIG_DIR/mainnet-config.json https://hydra.iohk.io/build/7654130/download/1/mainnet-config.json
  curl -o $CONFIG_DIR/mainnet-topology.json https://hydra.iohk.io/build/7654130/download/1/mainnet-topology.json
  curl -o $CONFIG_DIR/mainnet-byron-genesis.json https://hydra.iohk.io/build/7654130/download/1/mainnet-byron-genesis.json
  curl -o $CONFIG_DIR/mainnet-shelley-genesis.json https://hydra.iohk.io/build/7654130/download/1/mainnet-shelley-genesis.json
  curl -o $CONFIG_DIR/mainnet-alonzo-genesis.json https://hydra.iohk.io/build/7654130/download/1/mainnet-alonzo-genesis.json
  curl -o $CONFIG_DIR/mainnet-conway-genesis.json https://hydra.iohk.io/build/7654130/download/1/mainnet-conway-genesis.json
  echo "Mainnet configuration files downloaded to $CONFIG_DIR"
else
  echo "Downloading testnet configuration files..."
  curl -o $CONFIG_DIR/testnet-config.json https://hydra.iohk.io/build/7654130/download/1/testnet-config.json
  curl -o $CONFIG_DIR/testnet-topology.json https://hydra.iohk.io/build/7654130/download/1/testnet-topology.json
  curl -o $CONFIG_DIR/testnet-byron-genesis.json https://hydra.iohk.io/build/7654130/download/1/testnet-byron-genesis.json
  curl -o $CONFIG_DIR/testnet-shelley-genesis.json https://hydra.iohk.io/build/7654130/download/1/testnet-shelley-genesis.json
  curl -o $CONFIG_DIR/testnet-alonzo-genesis.json https://hydra.iohk.io/build/7654130/download/1/testnet-alonzo-genesis.json
  curl -o $CONFIG_DIR/testnet-conway-genesis.json https://hydra.iohk.io/build/7654130/download/1/testnet-conway-genesis.json
  echo "Testnet configuration files downloaded to $CONFIG_DIR"
fi

# Make the script executable
chmod +x "$0"

echo "Configuration setup complete. You can now run your Cardano node."
echo "Set CARDANO_NODE_SOCKET_PATH to point to your node's socket file."
echo "Example: export CARDANO_NODE_SOCKET_PATH=/path/to/node.socket"
