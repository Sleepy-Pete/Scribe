#!/bin/bash

echo "=== AI Summary Test Script ==="
echo ""

# Check if API is running
echo "1. Checking API health..."
curl -s http://127.0.0.1:3737/health | jq '.' || echo "API not running!"
echo ""

# Get current AI settings
echo "2. Current AI settings:"
curl -s http://127.0.0.1:3737/api/ai/settings | jq '.'
echo ""

# Test AI connection
echo "3. Testing AI connection..."
curl -s -X POST http://127.0.0.1:3737/api/ai/test | jq '.'
echo ""

# Export today with AI summary
echo "4. Exporting today with AI summary..."
TODAY=$(date +%Y-%m-%d)
curl -s -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\"}" | jq '.'
echo ""

echo "=== Test Complete ==="

