# Context for Next Session - Scribe Activity Tracker

## ✅ RESOLVED: Architecture Mismatch Issue (2026-01-03)

### Solution Summary
The issue was resolved by reinstalling better-sqlite3 with the `--build-from-source` flag. The application is now running successfully.

### Root Cause
**Architecture Mismatch Between VSCode and Node.js Binaries**

The error in logs shows:
```
Error: dlopen(...better_sqlite3.node, 0x0001): 
mach-o file, but is an incompatible architecture (have 'arm64', need 'x86_64')
```

This means:
- The `better-sqlite3` native binary is compiled for ARM64
- But the Node.js process is trying to load it as x86_64 (Rosetta)
- This happens because **VSCode is running in Rosetta mode**, causing all child processes to run in x86_64 even though the binaries are ARM64

### What We Tried (All Failed)
1. ✗ Installed Node.js v20 LTS via nvm (to fix Node v24 incompatibility)
2. ✗ Rebuilt better-sqlite3 for ARM64 using `arch -arm64 npm rebuild better-sqlite3`
3. ✗ Rebuilt better-sqlite3 for x86_64 using `arch -x86_64 npm rebuild better-sqlite3` (still built ARM64)
4. ✗ Updated `start-tui.sh` to auto-detect and switch architectures
5. ✗ Cleaned and reinstalled all node_modules
6. ✗ Rebuilt shared modules

### Current State (WORKING ✅)
- **Node.js**: v20.19.6 (ARM64) installed via nvm
- **better-sqlite3 binary**: ARM64 (at `node_modules/better-sqlite3/build/Release/better_sqlite3.node`)
- **Terminal**: VSCode integrated terminal (ARM64 - not Rosetta)
- **API Server**: ✅ Running on http://127.0.0.1:3737
- **Tracker**: ✅ Running and tracking activity
- **TUI**: ✅ Running and displaying data

### Working Logs
```bash
# API log (logs/api.log)
[API] Server running on http://127.0.0.1:3737
[API] Database: /Users/Peter/.scribe-tracker/activity.db
[Obsidian] Auto-export enabled, scheduled for 18:00

# Tracker log (logs/tracker.log)
[Tracker] Settings loaded: polling=1000ms, idle=60s
[Tracker] Starting activity tracker...
[Tracker] Tracker started successfully
```

### System Information
- **OS**: macOS (Darwin 22.6.0)
- **Machine**: Apple Silicon (M1/M2/M3)
- **Terminal**: VSCode integrated terminal (ARM64 native)
- **Shell**: zsh
- **Architecture**: arm64 (native, not Rosetta)

### Files Modified
1. **start-tui.sh** - Updated to load nvm, check for better-sqlite3, and display Node binary architecture
2. **TROUBLESHOOTING.md** - Created with common solutions
3. **node_modules/better-sqlite3** - Reinstalled with `--build-from-source` flag

### ✅ Solution That Worked

The issue was NOT actually a VSCode Rosetta problem. The diagnostics showed everything was ARM64:
- VSCode: ARM64 native
- Node.js: ARM64 (v20.19.6 via nvm)
- System: ARM64

**The actual fix was simple:**
```bash
# Reinstall better-sqlite3 with build-from-source flag
npm uninstall better-sqlite3
npm install better-sqlite3@11.8.1 --build-from-source
```

This forced npm to rebuild the native binary correctly for the ARM64 architecture, resolving the mismatch.

### Why This Worked
The previous better-sqlite3 installation may have been:
1. Installed with a cached/prebuilt binary for the wrong architecture
2. Built with a different Node version or architecture setting
3. Corrupted during a previous rebuild attempt

The `--build-from-source` flag ensures npm compiles the native module from scratch using the current Node.js binary and system architecture.

### Alternative Solutions (Not Needed)
These were considered but not necessary:
- ❌ Option 1: Fix VSCode Rosetta mode (VSCode was already ARM64)
- ❌ Option 2: Build universal binary (not needed)
- ❌ Option 3: Use native terminal (VSCode terminal works fine)
- ❌ Option 4: Force x86_64 (would be backwards)
- ❌ Option 5: Replace SQLite library (better-sqlite3 works fine)

### Quick Diagnostic Commands
```bash
# Check what's running
lsof -i :3737
ps aux | grep ts-node

# Check architectures
uname -m
file $(which node)
file node_modules/better-sqlite3/build/Release/better_sqlite3.node

# Check logs
cat logs/api.log
cat logs/tracker.log

# Start the application
./start-tui.sh

# Kill all processes
pkill -f "ts-node"
```

### Lessons Learned
1. **Don't assume Rosetta is the problem** - Always verify with `file` command
2. **The error message was misleading** - It said "have arm64, need x86_64" but the real issue was a corrupted/mismatched binary
3. **--build-from-source is powerful** - When in doubt with native modules, rebuild from source
4. **VSCode on Apple Silicon works fine** - No need to use external terminals

### How to Prevent This in the Future
Add this to package.json scripts:
```json
"postinstall": "npm rebuild better-sqlite3"
```

Or add a check in start-tui.sh to verify binary architecture matches Node architecture before starting.

