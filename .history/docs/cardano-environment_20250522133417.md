# Cardano Environment Setup

This guide provides instructions for setting up a Cardano node environment for use with the GitHub MCP Server.

## Prerequisites

- Docker and Docker Compose
- Node.js 24 or later
- pnpm 10 or later

## Using the Bundled Docker Setup

The GitHub MCP Server includes a Docker Compose configuration that sets up a complete Cardano development environment. This includes:

1. A Cardano node (running on the selected network)
2. An Ogmios instance (for easier interaction with the node)
3. The MCP server itself

### Configuration

Adjust the environment variables in the `.env` file or pass them when starting the services:

```
# Network: mainnet, preprod, preview, testnet
CARDANO_NETWORK=testnet

# Node configuration
CARDANO_NODE_PORT=3001

# Ogmios configuration
OGMIOS_PORT=1337
```

## Usage

### Starting the Environment

```bash
docker-compose up -d
```

### Accessing the Cardano Node

The Cardano node socket is available at:

```
/ipc/node.socket
```

### Using the MCP Server with the Node

When running the MCP server, set the socket path:

```bash
CARDANO_NODE_SOCKET_PATH=/ipc/node.socket npm start
```

### Shutting Down

```bash
docker-compose down
```

For persistent data between restarts, mount volumes for the node database.

## Service Details

- **cardano-node**: Full Cardano node implementation
- **ogmios**: WebSocket API for Cardano node interaction
- **mcp-server**: GitHub MCP Server with Cardano support

## Development Workflow

1. Run `docker-compose up -d cardano-node ogmios` to start the blockchain services
2. Develop the MCP server locally, pointing to the containerized node
3. When ready, build and run the complete stack with all services
