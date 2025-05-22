FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install essential tools
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libffi-dev \
    libgmp-dev \
    libssl-dev \
    libtinfo-dev \
    libsystemd-dev \
    zlib1g-dev \
    make \
    g++ \
    tmux \
    jq \
    libncursesw5 \
    libtool \
    autoconf \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Aiken
RUN curl -sSfL https://install.aiken-lang.org | bash -s -- -y

# Add ~/.aiken/bin to PATH
ENV PATH="/root/.aiken/bin:${PATH}"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript project
RUN npm run build

# Expose ports
EXPOSE 3000

# Set default environment variables
ENV NODE_ENV=development
ENV CARDANO_NETWORK=testnet
ENV CARDANO_NODE_SOCKET_PATH=/ipc/node.socket

# Command to run the application
CMD ["npm", "start"]
