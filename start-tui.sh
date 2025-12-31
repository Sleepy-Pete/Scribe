#!/bin/bash

# Scribe Activity Tracker TUI Startup Script

echo "🚀 Starting Scribe Activity Tracker (TUI Mode)..."
echo ""

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

