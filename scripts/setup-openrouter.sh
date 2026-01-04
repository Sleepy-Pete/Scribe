#!/bin/bash

# OpenRouter Setup Script for Scribe Tracker
# This script helps you configure OpenRouter AI for daily summaries

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Scribe Tracker - OpenRouter Setup                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if API is running
echo "🔍 Checking if API server is running..."
if ! curl -s http://127.0.0.1:3737/api/health > /dev/null 2>&1; then
    echo "❌ API server is not running!"
    echo ""
    echo "Please start the API server first:"
    echo "  npm run dev:api"
    echo ""
    exit 1
fi
echo "✅ API server is running"
echo ""

# Get API key
echo "📝 OpenRouter API Key Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Visit: https://openrouter.ai/keys"
echo "2. Sign up or log in"
echo "3. Create a new API key"
echo "4. Copy the key (starts with sk-or-v1-...)"
echo ""
read -p "Enter your OpenRouter API key: " API_KEY

if [[ ! $API_KEY =~ ^sk-or-v1- ]]; then
    echo "⚠️  Warning: API key doesn't start with 'sk-or-v1-'"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo ""
echo "🤖 Choose AI Model"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. google/gemini-flash-1.5-8b      (~$0.02/month) - Recommended"
echo "2. google/gemini-2.0-flash-exp:free (FREE) - Rate limited"
echo "3. anthropic/claude-3.5-haiku      (~$0.50/month) - Better quality"
echo "4. anthropic/claude-3.7-sonnet     (~$3.00/month) - Best quality"
echo "5. Custom model name"
echo ""
read -p "Select model (1-5) [1]: " MODEL_CHOICE
MODEL_CHOICE=${MODEL_CHOICE:-1}

case $MODEL_CHOICE in
    1)
        MODEL="google/gemini-flash-1.5-8b"
        ;;
    2)
        MODEL="google/gemini-2.0-flash-exp:free"
        ;;
    3)
        MODEL="anthropic/claude-3.5-haiku"
        ;;
    4)
        MODEL="anthropic/claude-3.7-sonnet"
        ;;
    5)
        read -p "Enter custom model name: " MODEL
        ;;
    *)
        MODEL="google/gemini-flash-1.5-8b"
        ;;
esac

echo ""
echo "📤 Configuring Scribe..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configure settings
RESPONSE=$(curl -s -X PUT http://127.0.0.1:3737/api/ai/settings \
  -H "Content-Type: application/json" \
  -d "{
    \"provider\": \"openrouter\",
    \"model\": \"$MODEL\",
    \"api_key\": \"$API_KEY\",
    \"enabled\": true
  }")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Configuration saved successfully!"
else
    echo "❌ Configuration failed!"
    echo "Response: $RESPONSE"
    exit 1
fi

echo ""
echo "🧪 Testing AI connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TEST_RESPONSE=$(curl -s -X POST http://127.0.0.1:3737/api/ai/test)

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ AI connection successful!"
    echo ""
    echo "Test summary:"
    echo "$TEST_RESPONSE" | grep -o '"summary":"[^"]*"' | sed 's/"summary":"//' | sed 's/"$//'
else
    echo "❌ AI connection failed!"
    echo "Response: $TEST_RESPONSE"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Your Scribe Tracker is now configured with:"
echo "  • Provider: OpenRouter"
echo "  • Model: $MODEL"
echo "  • AI Summaries: Enabled"
echo ""
echo "Next steps:"
echo "  1. Export today's data:"
echo "     curl -X POST http://127.0.0.1:3737/api/obsidian/export \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"date\":\"$(date +%Y-%m-%d)\"}'"
echo ""
echo "  2. Check your Obsidian vault at:"
echo "     ~/Petros/Scribe Tracker/"
echo ""
echo "  3. View settings anytime:"
echo "     curl http://127.0.0.1:3737/api/ai/settings"
echo ""
echo "Happy tracking! 📊"

