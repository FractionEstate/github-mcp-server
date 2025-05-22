#!/bin/bash
# Script to migrate from npm to pnpm

# Install pnpm
echo "Installing pnpm..."
npm install -g pnpm

# Remove existing node_modules and lock files
echo "Removing existing node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Install dependencies using pnpm
echo "Installing dependencies with pnpm..."
pnpm install

# Update package.json scripts to use pnpm
# (This is optional, as npm run commands will still work)
echo "Updating package.json scripts..."
sed -i 's/"build": "tsc"/"build": "pnpm tsc"/g' package.json
sed -i 's/"start": "node build\/index.js"/"start": "pnpm node build\/index.js"/g' package.json
sed -i 's/"dev": "tsc && node build\/index.js"/"dev": "pnpm tsc && pnpm node build\/index.js"/g' package.json
sed -i 's/"test": "jest"/"test": "pnpm jest"/g' package.json
sed -i 's/"lint": "eslint src\/\*\*\/\*.ts"/"lint": "pnpm eslint src\/\*\*\/\*.ts"/g' package.json

# Create .npmrc file with recommended pnpm settings
echo "Creating .npmrc file with recommended settings..."
cat > .npmrc << EOL
node-linker=hoisted
strict-peer-dependencies=false
auto-install-peers=true
EOL

# Create pnpm-workspace.yaml for potential future monorepo setup
echo "Creating pnpm-workspace.yaml for future expansion..."
cat > pnpm-workspace.yaml << EOL
packages:
  - '.'
  # Uncomment below when expanding to monorepo
  # - 'packages/*'
EOL

# Update CI/CD workflow for pnpm
echo "Updating GitHub Actions workflow for pnpm..."
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << EOL
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=\$(pnpm store path)" >> \$GITHUB_OUTPUT

      - uses: actions/cache@v3
        name: Setup pnpm cache
        with:
          path: \${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: \${{ runner.os }}-pnpm-store-\${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            \${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test

      - name: Lint
        run: pnpm lint

  publish:
    name: Publish
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'
          registry-url: 'https://registry.npmjs.org'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Publish
        run: pnpm publish
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN || github.token }}
EOL

echo "Migration to pnpm completed successfully!"
echo "Run 'pnpm install' to install dependencies, then 'pnpm dev' to start development"
