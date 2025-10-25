#!/bin/bash

# Production Deployment Script for Veri x Flow Integration

set -e

echo "🚀 Starting Veri x Flow Integration Deployment..."

# Check if we're in the right directory
if [ ! -f "flow.json" ]; then
    echo "❌ Error: flow.json not found. Please run from project root."
    exit 1
fi

# Set production environment variables
export NODE_ENV=production
export FLOW_ACCESS_NODE=https://access.mainnet.nodes.onflow.org:9000
export ORACLE_ADDRESS=0x14aca78d100d2001
export FLOW_TOKEN_ADDRESS=0x1654653399040a61

echo "📋 Production Configuration:"
echo "   Network: Mainnet"
echo "   Oracle: $ORACLE_ADDRESS"
echo "   Flow Token: $FLOW_TOKEN_ADDRESS"

# Deploy contracts to mainnet
echo "📦 Deploying contracts to mainnet..."
cd cadence/contracts

# Deploy CreatorProfile contract
echo "   Deploying CreatorProfile contract..."
flow accounts add-contract ./CreatorProfile.cdc 0x14aca78d100d2001 --signer mainnet-veri --network mainnet

# Deploy CampaignEscrow contract
echo "   Deploying CampaignEscrow contract..."
flow accounts add-contract ./CampaignEscrow.cdc 0x14aca78d100d2001 --signer mainnet-veri --network mainnet

cd ../..

echo "✅ Contracts deployed successfully!"

# Build backend
echo "🔨 Building backend..."
cd verifier
npm install
npm run build
cd ..

# Deploy to Fly.io
echo "☁️ Deploying to Fly.io..."
fly deploy --remote-only

echo "🎉 Deployment completed successfully!"
echo "📊 Oracle Server: https://brightmatter-oracle.fly.dev"
echo "🔗 Health Check: https://brightmatter-oracle.fly.dev/api/health"

