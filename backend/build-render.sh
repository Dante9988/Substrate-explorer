#!/bin/bash

# Render-specific build script for backend only
echo "🚀 Building backend for Render deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies (including devDependencies for build)
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Build the shared package first if it exists
if [ -d "../shared" ]; then
    echo "🔨 Building shared package..."
    cd ../shared
    yarn install --frozen-lockfile
    yarn build
    cd ../backend
fi

# Build the application
echo "🔨 Building backend application..."
yarn build

echo "✅ Build completed successfully!"
