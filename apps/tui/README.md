# Scribe TUI - Terminal User Interface

A beautiful terminal-based dashboard for the Scribe Activity Tracker.

## Features

- **📅 Timeline View**: See your activity timeline in chronological order
- **📊 Statistics View**: View daily stats with visual progress bars
  - Top applications by usage time
  - Top websites by usage time
  - Call sessions with duration
- **⚙️ Settings View**: View system configuration and settings
- **🔄 Auto-refresh**: Updates every 5 seconds automatically
- **⌨️ Keyboard Navigation**: Full keyboard control

## Prerequisites

- Node.js v18 or higher
- API server running on port 3737
- Tracker service running (for live data)

## Installation

From the TUI directory:

```bash
npm install
```

## Running the TUI

### Option 1: Use the startup script (Recommended)

From the project root:

```bash
./start-tui.sh
```

This will:
1. Build shared modules if needed
2. Start the API server in the background
3. Start the tracker in the background
4. Launch the TUI dashboard

### Option 2: Run manually

Make sure the API server is running first:

```bash
# Terminal 1: Start API
cd apps/api
npx ts-node src/index.ts

# Terminal 2: Start Tracker (optional, for live tracking)
cd apps/tracker
npx ts-node src/index.ts

# Terminal 3: Start TUI
cd apps/tui
npx ts-node src/index.ts
```

## Keyboard Controls

- **q** or **Ctrl+C**: Quit the application
- **1**: Switch to Timeline view
- **2**: Switch to Statistics view
- **3**: Switch to Settings view
- **r**: Manually refresh data
- **↑/↓**: Scroll up/down in the current view
- **Mouse**: Scroll with mouse wheel (if supported)

## Views

### Timeline View (Tab 1)

Shows your activity in chronological order (most recent first):
- Application usage with window titles
- Website visits with URLs
- Call sessions with provider and duration
- Total active time and activity count

### Statistics View (Tab 2)

Displays daily statistics:
- Total active time
- Number of app switches
- Top 10 applications with visual progress bars
- Top 10 websites with visual progress bars
- All call sessions with timestamps

### Settings View (Tab 3)

Shows system configuration:
- API connection status
- Database location
- Tracker settings (polling interval, idle timeout)
- Obsidian integration settings
- All custom settings

## Architecture

The TUI is built with:
- **blessed**: Terminal UI framework
- **TypeScript**: Type-safe development
- **axios**: HTTP client for API communication

### File Structure

```
apps/tui/
├── src/
│   ├── index.ts          # Entry point
│   ├── tui.ts            # Main TUI class
│   ├── api-client.ts     # API client wrapper
│   └── views/
│       ├── timeline.ts   # Timeline view
│       ├── stats.ts      # Statistics view
│       └── settings.ts   # Settings view
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### TUI won't start

- Make sure the API server is running on port 3737
- Check that shared modules are built: `cd shared/types && npm run build`
- Verify dependencies are installed: `npm install`

### No data showing

- Ensure the tracker is running and recording activity
- Check the API is accessible: `curl http://127.0.0.1:3737/health`
- Wait a few seconds for data to be recorded

### Display issues

- Make sure your terminal supports colors and Unicode
- Try resizing your terminal window
- Use a modern terminal emulator (iTerm2, Hyper, Windows Terminal, etc.)

### Refresh not working

- Press 'r' to manually refresh
- Check the status bar for error messages
- Verify API connectivity

## Development

### Running in development mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Adding new views

1. Create a new view class in `src/views/`
2. Implement the `render()` method
3. Add the view to `src/tui.ts`
4. Add keyboard binding for the new tab

## License

MIT

