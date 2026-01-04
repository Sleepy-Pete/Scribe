#!/bin/bash

# Scribe Activity Tracker TUI Startup Script

# Load nvm if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node 20
nvm use 20 >/dev/null 2>&1 || true

echo "🚀 Starting Scribe Activity Tracker (TUI Mode)..."
echo "📌 Architecture: $(uname -m)"
echo "📌 Using Node.js $(node --version)"
echo "📌 Node binary: $(file $(which node) | cut -d: -f2)"
echo ""

# Check if better-sqlite3 needs to be rebuilt for current architecture
CURRENT_ARCH=$(uname -m)
SQLITE_BINARY="shared/database/node_modules/better-sqlite3/build/Release/better_sqlite3.node"

if [ -f "$SQLITE_BINARY" ]; then
  # Check if binary matches current architecture
  BINARY_ARCH=$(file "$SQLITE_BINARY" | grep -o "arm64\|x86_64" | head -1)
  if [ "$CURRENT_ARCH" = "arm64" ] && [ "$BINARY_ARCH" != "arm64" ]; then
    echo "⚠️  Architecture mismatch detected: binary is $BINARY_ARCH, system is $CURRENT_ARCH"
    echo "📦 Rebuilding better-sqlite3 for $CURRENT_ARCH..."
    cd shared/database && npm install better-sqlite3@latest >/dev/null 2>&1 && cd ../..
    echo "✅ better-sqlite3 rebuilt for $CURRENT_ARCH"
  fi
elif [ ! -f "$SQLITE_BINARY" ]; then
  echo "📦 Building better-sqlite3 for $CURRENT_ARCH..."
  cd shared/database && npm install better-sqlite3@latest >/dev/null 2>&1 && cd ../..
  echo "✅ better-sqlite3 built"
fi

# Check if shared modules are built
if [ ! -d "shared/types/dist" ] || [ ! -d "shared/database/dist" ]; then
  echo "📦 Building shared modules..."
  cd shared/types && npm run build && cd ../..
  cd shared/database && npm run build && cd ../..
  echo "✅ Shared modules built"
  echo ""
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start API server in background (redirect logs)
echo "🌐 Starting API server on http://127.0.0.1:3737..."
cd apps/api
npx ts-node src/index.ts > ../../logs/api.log 2>&1 &
API_PID=$!
cd ../..

# Wait for API to start
sleep 2

# Start tracker in background (redirect logs)
echo "👁️  Starting activity tracker..."
cd apps/tracker
npx ts-node src/index.ts > ../../logs/tracker.log 2>&1 &
TRACKER_PID=$!
cd ../..

# Wait for tracker to initialize
sleep 1

echo ""
echo "⚠️  IMPORTANT: Make sure you have granted the following permissions:"
echo "   - Accessibility (System Preferences > Security & Privacy > Privacy > Accessibility)"
echo "   - Screen Recording (System Preferences > Security & Privacy > Privacy > Screen Recording)"
echo ""
echo "📊 Starting TUI Dashboard..."
echo "📝 Logs are being written to: logs/api.log and logs/tracker.log"
echo ""
sleep 1

# Clear screen before starting TUI
clear

# Start TUI (this will block until user quits)
cd apps/tui
npx ts-node src/index.ts

# Cleanup on exit
echo ""
echo "🛑 Stopping services..."
kill $API_PID 2>/dev/null
kill $TRACKER_PID 2>/dev/null
echo "✅ Stopped"

