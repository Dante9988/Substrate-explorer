#!/bin/bash
# Script to test Dockerfile locally before deploying to Railway

set -e

echo "🐳 Testing Dockerfile build locally..."
echo ""

# Build the Docker image
# Note: Build from root directory, Dockerfile expects backend/ context
echo "📦 Building Docker image..."
cd ..
docker build -t substrate-explorer-test -f backend/Dockerfile .

echo ""
echo "✅ Docker build successful!"
echo ""
echo "🧪 Testing image..."
echo ""

# Test that the image can start (with a mock DATABASE_URL)
echo "Starting container with test DATABASE_URL..."
docker run --rm \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e NODE_ENV=production \
  substrate-explorer-test \
  sh -c "echo 'Container started successfully!' && npx prisma --version"

echo ""
echo "✅ All tests passed!"
echo ""
echo "🚀 Ready to deploy to Railway!"

