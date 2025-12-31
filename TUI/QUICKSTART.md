# Scribe TUI - Quick Start Guide

Get up and running with the Scribe Terminal User Interface in 5 minutes!

## Prerequisites

- Node.js v18 or higher installed
- macOS (currently only macOS is supported)
- Terminal application with color support

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Build Shared Modules

```bash
cd shared/types && npm run build && cd ../..
cd shared/database && npm run build && cd ../..
```

## Step 3: Grant macOS Permissions

**CRITICAL**: The tracker requires special permissions.

1. **Accessibility Permission**:
   - Go to **System Preferences** → **Security & Privacy** → **Privacy** → **Accessibility**
   - Click the lock icon to make changes
   - Add your terminal application (Terminal.app, iTerm, etc.)
   - Enable the checkbox

2. **Screen Recording Permission**:
   - Go to **System Preferences** → **Security & Privacy** → **Privacy** → **Screen Recording**
   - Add your terminal application
   - Enable the checkbox
   - **Restart your terminal** after granting permission

## Step 4: Start the TUI

```bash
./start-tui.sh
```

This will:
1. ✅ Build shared modules (if needed)
2. ✅ Start the API server in the background
3. ✅ Start the activity tracker in the background
4. ✅ Launch the TUI dashboard

## Step 5: Use the TUI

You should now see the Scribe TUI dashboard!

### Keyboard Controls

- **1**: Timeline view - See your activity chronologically
- **2**: Statistics view - View daily stats and top apps
- **3**: Settings view - View configuration and system info
- **r**: Refresh data manually
- **↑/↓**: Scroll up and down
- **q** or **Ctrl+C**: Quit the application

### What You'll See

**Timeline View (Tab 1)**
- Recent activity listed chronologically
- Application names and window titles
- Website visits (when browser extension is installed)
- Call sessions with provider and duration
- Total active time

**Statistics View (Tab 2)**
- Total active time for the day
- Number of app switches
- Top 10 applications with visual progress bars
- Top 10 websites with visual progress bars
- All call sessions with timestamps

**Settings View (Tab 3)**
- API connection status
- Database location
- Tracker settings (polling interval, idle timeout)
- Obsidian integration settings
- All custom settings

## Troubleshooting

### "Permission denied" errors

Make sure you've granted both Accessibility and Screen Recording permissions, then restart your terminal.

### "Cannot connect to API" error

The API server might not be running. Check that port 3737 is available:

```bash
lsof -i :3737
```

If nothing is running, start the API manually:

```bash
cd apps/api
npx ts-node src/index.ts
```

### No data showing

Wait a few seconds for the tracker to record activity. The TUI auto-refreshes every 5 seconds, or press `r` to refresh manually.

### Display looks broken

- Make sure your terminal supports colors and Unicode
- Try resizing your terminal window
- Use a modern terminal emulator (iTerm2, Hyper, etc.)

## Next Steps

- **Customize settings**: Modify polling interval, idle timeout, etc. via the API
- **Export data**: Use the API endpoints to export to JSON, CSV, or Obsidian
- **View web dashboard**: Open http://127.0.0.1:3737/dashboard in your browser
- **Explore the API**: Check out http://127.0.0.1:3737/health

## Stopping the TUI

Press `q` or `Ctrl+C` to quit. This will:
1. Close the TUI dashboard
2. Stop the tracker service
3. Stop the API server

## Running Components Separately

If you want more control, you can run each component separately:

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

## Tips

- The TUI auto-refreshes every 5 seconds
- Use the web dashboard for more detailed analysis: http://127.0.0.1:3737/dashboard
- All data is stored locally in `~/.scribe-tracker/activity.db`
- The TUI works great with tmux or screen for persistent sessions

## Getting Help

- Check the main README.md for detailed documentation
- See apps/tui/README.md for TUI-specific information
- Review QUICKSTART.md for general setup instructions

Enjoy tracking your activity with Scribe! 🚀

