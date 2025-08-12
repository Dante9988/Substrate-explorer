#!/bin/bash

# Render-specific start script
echo "🚀 Starting backend on Render..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found. Please build the application first."
    exit 1
fi

# Start the application
echo "✅ Starting production server..."
yarn start:prod
