#!/bin/bash
# Heroku build script for unified deployment

echo "🔧 Installing Node.js dependencies..."
npm install

echo "🏗️ Building Next.js frontend..."
npm run build

echo "🐍 Python dependencies already installed by Heroku"
echo "✅ Build complete!"
