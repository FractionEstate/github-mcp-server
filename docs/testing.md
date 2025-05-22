# Testing Guide

This document provides information on testing the GitHub MCP Server.

## Unit Tests

The project includes unit tests written with Jest. To run the tests:

```bash
pnpm test
```

### Test Structure

The tests are located in the `src/__tests__` directory and are organized as follows:

- `basic.test.ts` - Basic functionality tests
- `aiken.test.ts` - Tests for Aiken smart contract functionality

## Adding New Tests

When adding new functionality, you should also add corresponding tests. Here's how:

1. Create a new test file in the `src/__tests__` directory
2. Import the necessary functions and utilities
3. Write your test cases

Example:

```typescript
import { describe, it, expect } from '@jest/globals';
import { yourFunction } from '../yourModule';

describe('Your Module', () => {
  it('should perform the expected action', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## Integration Testing

For integration testing with actual GitHub API or Cardano nodes:

1. Set up the required environment variables for authentication
2. Run the tests with the integration flag:

```bash
GITHUB_TOKEN=your_token pnpm test -- --testPathPattern=integration
```

## Testing with a Cardano Node

To test functionality that requires a Cardano node:

1. Start a local Cardano node using Docker:

```bash
docker-compose up cardano-node
```

2. Set the environment variables:

```bash
export CARDANO_NODE_SOCKET_PATH=/ipc/node.socket
export CARDANO_NETWORK=testnet
```

3. Run the node-specific tests:

```bash
pnpm test -- --testPathPattern=cardano-node
```

## Mocking External Dependencies

For testing without external dependencies, the project uses Jest's mocking capabilities:

```typescript
jest.mock('../externalDependency', () => ({
  someFunction: jest.fn().mockReturnValue('mocked value'),
}));
```

## Coverage Reports

To generate test coverage reports:

```bash
pnpm test -- --coverage
```

The coverage report will be available in the `coverage` directory.
