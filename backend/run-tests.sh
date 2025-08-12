#!/bin/bash

echo "🧪 Running Blockchain Explorer Backend Tests..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Run tests with coverage
echo "🔍 Running tests with coverage..."
echo "Using yarn..."
yarn test:cov

echo ""
echo "Alternative: You can also use npm commands:"
echo "  npm run test          # Run tests once"
echo "  npm run test:watch    # Run tests in watch mode"
echo "  npm run test:cov      # Run tests with coverage"

echo "✅ Tests completed!"
