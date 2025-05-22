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

### Starting the Environment

```bash
# Start with testnet (default)
docker-compose up

# Or start with mainnet
CARDANO_NETWORK=mainnet docker-compose up

# Or start with preview network
CARDANO_NETWORK=preview docker-compose up
```

### Checking Node Status

Once the environment is running, you can check the node status:

```bash
# Using the MCP server
curl -X POST http://localhost:3000/v1/tools -H "Content-Type: application/json" -d '{
  "name": "check-cardano-node",
  "parameters": {}
}'

# Or directly using cardano-cli
docker exec -it github-mcp-server_cardano-node_1 cardano-cli query tip --testnet-magic 1097911063
```

## Manual Setup

If you prefer to run the Cardano node directly on your host system:

### 1. Install Cardano Node

Follow the [official installation instructions](https://developers.cardano.org/docs/get-started/installing-cardano-node/).

### 2. Start the Node

```bash
cardano-node run \
  --topology /path/to/testnet-topology.json \
  --database-path /path/to/db \
  --socket-path /path/to/node.socket \
  --host-addr 0.0.0.0 \
  --port 3001 \
  --config /path/to/testnet-config.json
```

### 3. Set Environment Variables

```bash
export CARDANO_NODE_SOCKET_PATH=/path/to/node.socket
export CARDANO_NETWORK=testnet
```

### 4. Start the MCP Server

```bash
pnpm start
```

## Using the Cardano Tools

Once your environment is set up, you can use the Cardano tools provided by the MCP server:

### Example: Check Node Status

```bash
curl -X POST http://localhost:3000/v1/tools -H "Content-Type: application/json" -d '{
  "name": "check-cardano-node",
  "parameters": {}
}'
```

### Example: Generate Keys

```bash
curl -X POST http://localhost:3000/v1/tools -H "Content-Type: application/json" -d '{
  "name": "generate-cardano-keys",
  "parameters": {
    "type": "payment",
    "network": "testnet"
  }
}'
```

## Troubleshooting

### Node Not Syncing

If your node appears to be stuck:

```bash
# Check sync status
curl -X POST http://localhost:3000/v1/tools -H "Content-Type: application/json" -d '{
  "name": "check-cardano-node",
  "parameters": {}
}'

# Restart the node
docker-compose restart cardano-node
```

### Socket Connection Issues

If you see socket connection errors:

1. Verify the socket path is correct
2. Check that the node is running
3. Ensure permissions are set correctly

```bash
# Fix socket permissions
sudo chmod 666 /path/to/node.socket
```

### Memory Issues

Cardano nodes can require significant memory:

```bash
# Allocate more memory to Docker
# Edit your Docker Desktop settings or Docker daemon configuration
```

## Resources

- [Cardano Documentation](https://docs.cardano.org/)
- [Cardano Developers Portal](https://developers.cardano.org/)
- [Ogmios Documentation](https://ogmios.dev/)
- [Aiken Documentation](https://aiken-lang.org/)
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
