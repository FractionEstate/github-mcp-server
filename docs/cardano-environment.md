# Cardano Development Environment for MCP Server

This Docker Compose configuration sets up a complete Cardano development environment with:

1. A Cardano node connected to the desired network
2. Ogmios API for WebSocket access to the node
3. An environment for building and running the MCP server

## Configuration

Adjust the environment variables in the `.env` file:

```
# Network: mainnet, preprod, preview
CARDANO_NETWORK=preview

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
