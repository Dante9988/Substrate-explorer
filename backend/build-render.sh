#!/bin/bash

# Render-specific build script for backend only
echo "🚀 Building backend for Render deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Build the application
echo "🔨 Building application..."
yarn build

echo "✅ Build completed successfully!"
