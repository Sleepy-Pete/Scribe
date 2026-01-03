# Obsidian Export Format Update

## Summary

The Obsidian export markdown format has been reorganized to put the most important information at the top:

1. **Stats** - Total active time and breakdown by activity type (meetings, coding, communication, browsing)
2. **Top Apps** - List of most-used applications with time spent
3. **Timeline** - Chronological activity log (moved to the bottom)

## Changes Made

### File Created: `apps/api/src/obsidian.ts`

This file contains all the Obsidian integration logic:
- `generateDailyMarkdown()` - Generates the markdown content with the new format
- `exportToObsidian()` - Exports to the Obsidian vault
- `getObsidianSettings()` - Retrieves Obsidian settings

### New Export Format

```markdown
# Daily Summary - Tuesday, December 31, 2025

## Stats

- **Total active time:** 1h 20m
- **Meetings:** 30m
- **Coding:** 30m
- **Browsing:** 15m

## Top Apps

1. **Visual Studio Code** - 30m
2. **Google Chrome** - 15m
3. **Slack** - 10m

## Timeline

- **10:00-10:30** (30m) - Visual Studio Code
  - obsidian.ts — Scribe
- **10:30-10:45** (15m) - github.com
  - https://github.com/user/repo
- **11:00-11:30** (30m) - Google Meet
  - Team Meeting
```

## Configuration

The Obsidian vault path is configured in the database settings:
- **Default path**: `/Users/Peter/Petros`
- **Can be changed via**: Dashboard settings or API endpoint

## Testing

A test script (`test-obsidian-export.js`) has been created to verify the format without needing to run the full tracker.

Run it with:
```bash
node test-obsidian-export.js
```

## Next Steps to Test with Real Data

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the tracker**:
   ```bash
   # Option 1: Use npm scripts
   npm run dev:api    # In one terminal
   npm run dev:tracker # In another terminal
   
   # Option 2: If start-tracker.sh exists
   ./start-tracker.sh
   ```

3. **Test the export**:
   ```bash
   # Preview the export (doesn't write to file)
   curl "http://127.0.0.1:3737/api/export/obsidian?date=2025-12-31"
   
   # Actually export to Obsidian vault
   curl -X POST http://127.0.0.1:3737/api/obsidian/export \
     -H "Content-Type: application/json" \
     -d '{"date":"2025-12-31"}'
   ```

4. **Check the output**:
   ```bash
   # View the generated file
   cat /Users/Peter/Petros/20251231.md
   ```

## Data Being Pulled

The export pulls the following information from the database:

### Events Table
- `kind` - Type of event (app, web, call)
- `app_name` - Application name
- `window_title` - Window title or tab name
- `domain` - Website domain (for web events)
- `url` - Full URL (for web events)
- `call_provider` - Call service (meet, discord, zoom, slack)
- `start_ts` - Start timestamp
- `end_ts` - End timestamp
- `active_seconds` - Duration in seconds

### Calculations
- **Total active time**: Sum of all `active_seconds`
- **Activity breakdown**: Events grouped by type (meetings, coding, communication, browsing)
- **Top apps**: Apps sorted by total `active_seconds`, limited to top 10
- **Timeline**: All events in chronological order with formatted times and durations

## Files Modified

- ✅ `apps/api/src/obsidian.ts` - Created (new file with reorganized format)
- ✅ `test-obsidian-export.js` - Created (test script)
- ✅ `OBSIDIAN_EXPORT_UPDATE.md` - Created (this file)

## Files NOT Modified

- ❌ `shared/database/src/index.ts` - Vault path kept at `/Users/Peter/Petros` (not changed to iCloud)
- ❌ `CONTEXT.md` - Vault path kept at `/Users/Peter/Petros`

## Verification

Run the test script to see the new format:
```bash
node test-obsidian-export.js
```

Expected output shows:
- ✅ Stats section is FIRST
- ✅ Top Apps section is SECOND
- ✅ Timeline section is LAST

