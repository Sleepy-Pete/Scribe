# Scribe Activity Tracker

A local-first desktop activity tracker that monitors application usage, website activity, and call sessions. All data is stored locally in SQLite with no cloud connectivity.

> **🚀 Quick Start**: See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide!

## Features

- **Application Tracking**: Monitor active applications with window titles and usage duration
- **Website Tracking**: Track browser activity (requires browser extension - coming soon)
- **Call Detection**: Automatically detect calls from Google Meet, Discord, Zoom, and Slack
- **Privacy First**: All data stored locally, optional privacy mode to redact sensitive information
- **Session Management**: Intelligent session merging and idle detection
- **Export**: Export your data to JSON or CSV formats
- **TUI Dashboard**: Beautiful terminal-based interface for viewing your activity

## Architecture

```
/apps/desktop     # Electron + React UI
/apps/tracker     # Background tracking service
/apps/api         # Local REST API server (port 3737)
/apps/tui         # Terminal User Interface (TUI)
/shared/types     # Shared TypeScript types
/shared/database  # SQLite database module
/extensions       # Browser extensions (future)
```

## Prerequisites

- **Node.js**: v18 or higher
- **macOS**: Currently only macOS is supported (requires Accessibility permissions)
- **npm**: Comes with Node.js

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Scribe
```

2. Install dependencies:
```bash
npm install
```

3. Build shared modules:
```bash
cd shared/types && npm run build && cd ../..
cd shared/database && npm run build && cd ../..
```

## macOS Permissions Setup

**CRITICAL**: The tracker requires special permissions to access active window information.

### Required Permissions

1. **Accessibility Permission**:
   - Go to **System Preferences** → **Security & Privacy** → **Privacy** → **Accessibility**
   - Click the lock icon to make changes
   - Add your terminal application (Terminal.app, iTerm, etc.) or Node.js
   - Enable the checkbox

2. **Screen Recording Permission** (macOS 10.15+):
   - Go to **System Preferences** → **Security & Privacy** → **Privacy** → **Screen Recording**
   - Add your terminal application or Node.js
   - Enable the checkbox
   - **Restart your terminal** after granting permission

### Granting Permissions

When you first run the tracker, macOS will prompt you for these permissions. If you see errors like:
- `screen recording permission required`
- `accessibility permission required`

Follow the steps above to grant the necessary permissions.

## Running the Application

### TUI Mode (Terminal User Interface) - Recommended

Run the tracker with a beautiful terminal dashboard:

```bash
./start-tui.sh
```

This starts:
- **API Server**: http://127.0.0.1:3737
- **Tracker Service**: Background process polling active windows
- **TUI Dashboard**: Interactive terminal interface

**Keyboard Controls:**
- `1-3`: Switch between Timeline, Statistics, and Settings tabs
- `q` or `Ctrl+C`: Quit
- `r`: Refresh data
- `↑/↓`: Scroll

### Development Mode (Web UI)

Run all services with the web-based dashboard:

```bash
npm run dev
```

This starts:
- **API Server**: http://127.0.0.1:3737
- **Tracker Service**: Background process polling active windows
- **Desktop UI**: http://localhost:5173 (Vite dev server)

### Running Services Individually

```bash
# API Server only
npm run dev:api

# Tracker only
npm run dev:tracker

# Desktop UI only
npm run dev:desktop

# TUI only (requires API to be running)
cd apps/tui && npm run dev
```

## Usage

### Using the TUI (Recommended)

1. **Start the TUI**: Run `./start-tui.sh` in the project root
2. **Grant permissions**: When prompted, grant Accessibility and Screen Recording permissions
3. **Navigate the dashboard**: Use keyboard shortcuts to switch between views
4. **Monitor activity**: The tracker will start recording your application usage

### Using the Web UI

1. **Start the services**: Run `npm run dev` in the project root
2. **Grant permissions**: When prompted, grant Accessibility and Screen Recording permissions
3. **View the dashboard**: The Electron app will open automatically, or navigate to http://localhost:5173
4. **Monitor activity**: The tracker will start recording your application usage

### Dashboard Features (Both TUI and Web)

- **Timeline Tab**: Chronological view of today's activity
- **Statistics Tab**:
  - Top applications by time spent
  - Top websites by time spent (when browser extension is installed)
  - Detected call sessions
- **Settings Tab**: Export data, view database location, system configuration

## Database

### Location
```
~/.scribe-tracker/activity.db
```

### Schema

**events table**:
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  kind TEXT CHECK(kind IN ('app', 'web', 'call')) NOT NULL,
  app_name TEXT,
  process_name TEXT,
  window_title TEXT,
  url TEXT,
  domain TEXT,
  call_provider TEXT CHECK(call_provider IN ('meet', 'discord', 'zoom', 'slack', 'other')),
  start_ts INTEGER NOT NULL,
  end_ts INTEGER NOT NULL,
  active_seconds INTEGER NOT NULL,
  privacy_redacted BOOLEAN DEFAULT FALSE
);
```

**settings table**:
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

### Default Settings

- `polling_interval_ms`: 1000 (1 second)
- `idle_timeout_seconds`: 60 (1 minute)
- `privacy_mode`: false

## Privacy & Data Handling

### What is Tracked
- Application names and process names
- Window titles
- Active time duration
- Timestamps (start/end)
- Website domains and URLs (when browser extension is installed)

### What is NOT Tracked
- Keystrokes or typed content
- Message contents
- Screenshots or screen captures
- Page content or form data

### Privacy Mode
When enabled (future feature):
- Only domain names stored (no full URLs)
- Sensitive patterns redacted from window titles (emails, phone numbers, credit cards)
- Set via API: `PUT /api/settings/privacy_mode` with value `"true"`

## Call Detection

Calls are automatically detected based on these patterns:

- **Google Meet**: Domain contains `meet.google.com`
- **Discord**: App is Discord AND window title contains "Voice" or "Call"
- **Zoom**: App is "zoom.us" OR domain contains "zoom.us"
- **Slack**: App is Slack AND window title contains "huddle"

## API Endpoints

Base URL: `http://127.0.0.1:3737`

- `GET /health` - Health check
- `GET /api/events?start_ts=<ms>&end_ts=<ms>` - Get events in time range
- `GET /api/timeline/today` - Get today's timeline
- `GET /api/stats/daily?date=<YYYY-MM-DD>` - Get daily statistics
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update a setting
- `GET /api/export?format=json|csv&start_ts=<ms>&end_ts=<ms>` - Export data

## Building for Production

```bash
# Build all modules
npm run build

# Package Electron app
npm run package
```

The packaged app will be in `apps/desktop/release/`.

## Troubleshooting

### Tracker not recording activity
- Check that you've granted Accessibility and Screen Recording permissions
- Restart your terminal after granting permissions
- Check tracker logs for error messages

### API connection errors in UI
- Ensure the API server is running on port 3737
- Check for port conflicts: `lsof -i :3737`

### No data showing in dashboard
- Wait a few seconds for the tracker to record activity
- Check the database exists: `ls ~/.scribe-tracker/activity.db`
- Verify the tracker is running without errors

## Future Enhancements

- [ ] Browser extensions (Chrome, Firefox)
- [ ] Windows and Linux support
- [ ] Advanced privacy controls in UI
- [ ] Productivity insights and reports
- [ ] Custom call detection rules
- [ ] Data retention policies

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

