# Troubleshooting Guide

## Connection Error: ECONNREFUSED 127.0.0.1:3737

This error means the API server is not running or failed to start.

### Quick Fix

1. **Stop all running processes:**
   ```bash
   pkill -f "ts-node src/index.ts"
   ```

2. **Start the TUI:**
   ```bash
   ./start-tui.sh
   ```

3. **Verify the API is running:**
   ```bash
   curl http://127.0.0.1:3737/health
   ```

### Common Causes

#### 1. Architecture Mismatch (Rosetta vs ARM64)

**Symptom:** Error in logs: `mach-o file, but is an incompatible architecture`

**Solution:** The `start-tui.sh` script now automatically handles this. If you still have issues:

```bash
# Check your current architecture
uname -m

# If it shows x86_64 (Rosetta), rebuild better-sqlite3:
arch -arm64 npm rebuild better-sqlite3

# Then restart
./start-tui.sh
```

#### 2. Node.js Version Incompatibility

**Symptom:** Error about C++20 or compilation errors

**Solution:** Use Node.js 20 LTS (not v24):

```bash
# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node 20
nvm install 20
nvm use 20
nvm alias default 20

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### 3. Multiple Node Processes Running

**Symptom:** Port already in use or conflicting processes

**Solution:**

```bash
# Check what's using port 3737
lsof -i :3737

# Kill all Node processes related to Scribe
pkill -f "ts-node src/index.ts"

# Restart
./start-tui.sh
```

#### 4. Missing Native Bindings

**Symptom:** Error: `Could not locate the bindings file`

**Solution:**

```bash
# Rebuild better-sqlite3
npm rebuild better-sqlite3

# If that fails, reinstall
npm install better-sqlite3 --build-from-source
```

### Checking Logs

Always check the logs for detailed error messages:

```bash
# API server logs
cat logs/api.log

# Tracker logs
cat logs/tracker.log
```

### Verifying Everything is Running

```bash
# Check if API is responding
curl http://127.0.0.1:3737/health

# Check if port 3737 is in use
lsof -i :3737

# Check running processes
ps aux | grep ts-node
```

### Starting Services Manually

If the startup script fails, you can start services individually:

```bash
# Terminal 1: API Server
cd apps/api
npx ts-node src/index.ts

# Terminal 2: Tracker
cd apps/tracker
npx ts-node src/index.ts

# Terminal 3: TUI
cd apps/tui
npx ts-node src/index.ts
```

### Ensuring Correct Terminal Architecture

If you're on Apple Silicon (M1/M2/M3), ensure your terminal is running in native ARM64 mode:

1. **Check Terminal.app settings:**
   - Right-click Terminal.app in Applications
   - Get Info
   - Uncheck "Open using Rosetta"

2. **For iTerm2:**
   - Preferences > Profiles > General
   - Ensure "Use Rosetta" is unchecked

3. **Verify:**
   ```bash
   uname -m  # Should show "arm64", not "x86_64"
   ```

### Complete Reset

If nothing works, do a complete reset:

```bash
# 1. Kill all processes
pkill -f "ts-node"

# 2. Clean everything
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf shared/*/node_modules
rm -rf logs/*.log

# 3. Ensure correct Node version
nvm use 20

# 4. Reinstall
npm install

# 5. Rebuild shared modules
npm run build:shared

# 6. Start
./start-tui.sh
```

