#!/bin/bash

echo "🧪 Running Blockchain Explorer Integration Tests..."
echo "🌐 These tests connect to the LIVE Substrate network!"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Run only integration tests
echo "🔍 Running integration tests with live blockchain..."
yarn test --testPathPattern="integration" --verbose

echo "✅ Integration tests completed!"
