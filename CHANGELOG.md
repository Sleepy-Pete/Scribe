# Changelog

All notable changes to Scribe Activity Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [2026-01-03]

### Added
- **Export View in TUI**: New "Export" tab (Tab 4) that displays all available dates with activity data
  - Shows date, total active time, and event count for each day
  - Select a date and press `Enter` or `e` to export that day's data to Obsidian
  - Replaces the previous Jira tab
- **Date Summary API Endpoint**: `GET /api/dates/available` returns all dates with recorded activity
  - Includes `date`, `event_count`, and `total_active_seconds` for each date
  - Ordered by date descending (most recent first)
- **DateSummary Type**: New shared type for date summary data (`shared/types/src/index.ts`)
- **Centralized Styling System**: New `apps/tui/src/styles.ts` module
  - Unified color palette with primary, secondary, accent, and status colors
  - Reusable style configurations for blessed widgets
  - Helper functions for creating styled text with blessed tags
- **Auto-Export Scheduler**: Automatic Obsidian export at a configured time
  - Scheduler automatically restarts when export settings are updated
  - Runs daily at the configured `export_time`

### Fixed
- **Duration Calculation Bug**: Fixed incorrect duration calculations throughout the API
  - Now uses `(end_ts - start_ts) / 1000` instead of the unreliable `active_seconds` field
  - Affects timeline blocks, daily stats, top apps/sites, and call sessions
  - Resolves issues where durations were showing as 0 or incorrect values
- **Timezone Handling**: Fixed date parsing to use local timezone instead of UTC
  - Obsidian exports now correctly use local dates
  - Daily stats endpoint uses local timezone for date calculations
  - Prevents off-by-one-day errors near midnight

### Changed
- **TUI Tab Layout**: Reorganized tabs to `Timeline [1] | Statistics [2] | Settings [3] | Export [4]`
- **Status Bar**: Updated keyboard shortcut hints to reflect new Export tab functionality
- **API Client**: Added `getAvailableDates()` method to fetch date summaries

### Technical Details
- `apps/api/src/index.ts`: Updated duration calculations, added `/api/dates/available` endpoint
- `apps/api/src/obsidian.ts`: Added `startAutoExportScheduler()` function
- `apps/tui/src/tui.ts`: Replaced JiraView with ExportView, updated tab handling
- `apps/tui/src/views/export.ts`: New export view component
- `apps/tui/src/styles.ts`: New centralized styling module
- `apps/tui/src/api-client.ts`: Added `getAvailableDates()` method
- `shared/database/src/index.ts`: Added `getAvailableDates()` database function
- `shared/types/src/index.ts`: Added `DateSummary` interface

