# 🚀 Scribe TUI - Start Here!

## What's New?

Your Scribe Activity Tracker now has a **beautiful Terminal User Interface (TUI)**! 

Instead of opening a web browser, you can now view your activity data directly in your terminal with a modern, keyboard-driven interface.

## Quick Start (3 Steps)

### 1. Make sure you have permissions set up

If you haven't already, grant macOS permissions:
- **Accessibility**: System Preferences → Security & Privacy → Privacy → Accessibility
- **Screen Recording**: System Preferences → Security & Privacy → Privacy → Screen Recording

Add your terminal app (Terminal.app, iTerm, etc.) and restart your terminal.

### 2. Start the TUI

```bash
./start-tui.sh
```

That's it! The TUI will launch with:
- ✅ API server running in the background
- ✅ Activity tracker monitoring your apps
- ✅ Beautiful terminal dashboard

### 3. Navigate the interface

Use these keyboard shortcuts:

- **1** - Timeline view (see your activity chronologically)
- **2** - Statistics view (top apps, sites, calls with progress bars)
- **3** - Settings view (configuration and system info)
- **r** - Refresh data manually
- **↑/↓** - Scroll up and down
- **q** or **Ctrl+C** - Quit

## What You'll See

### Timeline View (Press 1)
```
📅 Today's Activity Timeline

🌐 google.com
   2:45:30 PM - 2:47:15 PM (1m 45s)
   https://google.com/search?q=...

💻 Visual Studio Code
   2:40:12 PM - 2:45:30 PM (5m 18s)
   scribe-tracker - tui.ts

📞 Google Meet Call
   2:15:00 PM - 2:40:00 PM (25m 0s)
   Team standup meeting
```

### Statistics View (Press 2)
```
📊 Daily Statistics

Date: 2025-12-31
Total Active Time: 3h 45m
App Switches: 127

💻 Top Applications
────────────────────────────────────────────────────────
1. Visual Studio Code
   ████████████████████████████░░ 2h 15m (60.0%)
2. Google Chrome
   ████████████░░░░░░░░░░░░░░░░░░ 1h 10m (31.1%)
3. Terminal
   ███░░░░░░░░░░░░░░░░░░░░░░░░░░░ 20m (8.9%)
```

### Settings View (Press 3)
```
⚙️  Settings & Configuration

System Information
────────────────────────────────────────────────────────
API Status: ✓ Connected
Database: /Users/you/.scribe-tracker/activity.db
API Endpoint: http://127.0.0.1:3737

Tracker Settings
────────────────────────────────────────────────────────
Polling Interval: 1000ms (1s)
Idle Timeout: 60s (1min)
Privacy Mode: Disabled
```

## Features

✨ **Auto-refresh**: Updates every 5 seconds automatically
✨ **Color-coded**: Apps (💻 cyan), Websites (🌐 green), Calls (📞 magenta)
✨ **Progress bars**: Visual representation of time spent
✨ **Scrollable**: Navigate through long lists with arrow keys
✨ **Lightweight**: No browser needed, runs in any terminal
✨ **SSH-friendly**: Works over remote connections

## Troubleshooting

### "Cannot connect to API"
The API server isn't running. The startup script should handle this, but if you see this error:
```bash
cd apps/api
npx ts-node src/index.ts
```

### No data showing
Wait a few seconds for the tracker to record activity. The TUI auto-refreshes every 5 seconds.

### Display looks weird
- Make sure your terminal supports colors (most modern terminals do)
- Try resizing your terminal window
- Use iTerm2, Hyper, or Windows Terminal for best results

## Alternative: Web Dashboard

If you prefer the web interface, you can still use it:

```bash
# Start everything
npm run dev

# Or just view the dashboard (if API is running)
open http://127.0.0.1:3737/dashboard
```

## Running in the Background

Want to keep the tracker running but close the TUI?

```bash
# Terminal 1: Start API and Tracker
cd apps/api && npx ts-node src/index.ts &
cd apps/tracker && npx ts-node src/index.ts &

# Terminal 2: Open TUI when you want to check stats
cd apps/tui && npx ts-node src/index.ts
```

## Tips & Tricks

1. **Use with tmux/screen**: Keep the TUI running in a persistent session
2. **Quick check**: Press `r` to refresh data immediately
3. **Focus mode**: The TUI is perfect for a dedicated monitoring terminal
4. **Export data**: Use the web dashboard or API for exports

## Next Steps

- 📖 Read [TUI_QUICKSTART.md](TUI_QUICKSTART.md) for detailed setup
- 📖 Read [apps/tui/README.md](apps/tui/README.md) for TUI documentation
- 📖 Read [README.md](README.md) for general Scribe documentation
- 🌐 Open http://127.0.0.1:3737/dashboard for the web interface

## Enjoy!

You now have a powerful, beautiful terminal interface for tracking your activity. Happy tracking! 🎉

---

**Questions?** Check the documentation or open an issue on GitHub.

