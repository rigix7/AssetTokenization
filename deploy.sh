#!/bin/bash

echo "🚀 Agricultural Asset Tokenization Platform - Deployment Script"
echo "================================================================"

# Step 1: Start Hardhat blockchain node
echo "📋 Step 1: Starting blockchain node..."
npx hardhat node --hostname 0.0.0.0 --port 8545 &
HARDHAT_PID=$!

# Wait for Hardhat to initialize
sleep 8
echo "✅ Blockchain node started (PID: $HARDHAT_PID)"

# Step 2: Deploy smart contracts
echo "📋 Step 2: Deploying smart contracts..."
npx hardhat run scripts/deploy-and-setup.ts --network localhost

if [ $? -eq 0 ]; then
    echo "✅ Smart contracts deployed successfully"
else
    echo "❌ Contract deployment failed"
    kill $HARDHAT_PID
    exit 1
fi

# Step 3: Start web server
echo "📋 Step 3: Starting web interface..."
echo "🌐 Platform available at: http://0.0.0.0:5000"
echo "🔗 Blockchain RPC: http://0.0.0.0:8545"
echo "🎯 Ready for stakeholder demonstrations"
echo ""
echo "Press Ctrl+C to stop the platform"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down platform..."
    kill $HARDHAT_PID 2>/dev/null
    echo "✅ Platform stopped"
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Start web server (this blocks)
node server.js