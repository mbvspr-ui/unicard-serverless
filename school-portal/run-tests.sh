#!/bin/bash

# Enhanced Photo Editor - Test Runner Script
# This script sets up and runs the tests for the photo editor

echo "========================================="
echo "Enhanced Photo Editor - Test Runner"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from unicard-serverless/school-portal directory"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Running npm install..."
    npm install
fi

echo "📦 Installing test dependencies..."
echo ""

# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/ui

echo ""
echo "✅ Test dependencies installed"
echo ""

# Check if test script exists in package.json
if ! grep -q '"test"' package.json; then
    echo "⚠️  Adding test script to package.json..."
    # This would need manual addition or use a tool like jq
    echo "Please add the following to your package.json scripts:"
    echo '  "test": "vitest",'
    echo '  "test:ui": "vitest --ui",'
    echo '  "test:run": "vitest run"'
fi

echo ""
echo "🧪 Running tests..."
echo ""

# Run tests
npm run test:run

echo ""
echo "========================================="
echo "Test run complete!"
echo "========================================="
