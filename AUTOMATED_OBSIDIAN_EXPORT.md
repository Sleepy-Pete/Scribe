# Automated Obsidian Export System

## Overview

I've built an automated end-of-day export system that:
1. **Creates a separate folder** (`Scribe Tracker/`) in your Obsidian vault for tracker exports
2. **Checks for existing personal notes** and merges them with tracker data
3. **Generates a summary** even if no personal note exists
4. **Runs automatically** at your configured time (default: 18:00)

## Features

### 1. Separate Tracker Folder
- All tracker exports go to `/Users/Peter/Petros/Scribe Tracker/`
- Keeps your vault organized
- Easy to distinguish tracker data from personal notes

### 2. Smart Merging
- Searches for personal notes matching the date (e.g., `20260101 - First Day.md`)
- If found, merges personal content with tracker data
- If not found, creates a tracker-only summary

### 3. Merged Format
```markdown
# Thursday, January 1, 2026

## Personal Notes

[Your personal note content here]

---

## Activity Summary (Tracked Data)

### Stats
- **Total active time:** 3h 3m
- **Coding:** 46m
- **Communication:** 1m

### Top Apps
1. **Google Chrome** - 2h 0m
2. **Code** - 33m
...
```

### 4. Automatic Scheduling
- Runs daily at configured time (default: 18:00)
- Checks every minute for the export time
- Logs success/failure to console

## Configuration

### Current Settings
```
Vault Path: /Users/Peter/Petros
Auto Export: true
Export Time: 18:00
```

### Update Settings via API
```bash
curl -X PUT http://127.0.0.1:3737/api/obsidian/settings \
  -H "Content-Type: application/json" \
  -d '{
    "vault_path": "/Users/Peter/Petros",
    "auto_export": true,
    "export_time": "22:00"
  }'
```

### Update Settings via TUI
1. Press `s` to open Settings
2. Navigate to Obsidian Integration section
3. Update values as needed

## Manual Export

### Export Today
```bash
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json"
```

### Export Specific Date
```bash
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-01"}'
```

### Via TUI
1. Press `e` to open Export view
2. Select a date
3. Press `Enter` or `e` to export

## File Naming Convention

- **Tracker Exports**: `YYYYMMDD - Export.md` (e.g., `20260101 - Export.md`)
- **Location**: `Scribe Tracker/` subfolder in your vault
- **Personal Notes**: Any file starting with `YYYYMMDD` (e.g., `20260101 - First Day.md`)

## How It Works

1. **At export time** (or manual trigger):
   - Fetches all events for the specified date
   - Searches vault root for personal notes matching the date
   - If personal note found, reads its content
   - Generates merged markdown combining both sources
   - Writes to `Scribe Tracker/YYYYMMDD - Export.md`

2. **Personal Note Detection**:
   - Looks for files starting with `YYYYMMDD`
   - Excludes files containing "Export" or "Merged" in the name
   - Reads the first matching file found

3. **Scheduler**:
   - Starts when API server starts
   - Checks every 60 seconds
   - Compares current time to configured export time
   - Triggers export when times match

## Example Workflow

### Daily Routine
1. Throughout the day: Tracker records your activity
2. Evening: Write personal notes in `20260102 - [Title].md`
3. 18:00 (or your configured time): Auto-export runs
4. Result: `Scribe Tracker/20260102 - Export.md` contains both personal notes and tracker data

### Review
- Open `Scribe Tracker/` folder in Obsidian
- See all your daily exports in one place
- Personal notes + objective data side by side

## Troubleshooting

### Export Not Running
- Check API server is running: `curl http://127.0.0.1:3737/health`
- Check auto_export setting: `curl http://127.0.0.1:3737/api/obsidian/settings`
- Check API logs for scheduler messages

### Personal Note Not Merged
- Ensure personal note filename starts with `YYYYMMDD`
- Ensure it's in the vault root (`/Users/Peter/Petros/`)
- Check it doesn't contain "Export" or "Merged" in filename

### Folder Not Created
- Ensure vault path is correct and accessible
- Check file permissions on vault directory

## Next Steps

Once the API server is running properly (after fixing the Node.js/better-sqlite3 compatibility issue):

1. Restart the API server
2. The scheduler will start automatically
3. Check logs for: `[Obsidian] Auto-export enabled, scheduled for 18:00`
4. Wait for export time or trigger manually
5. Check `Scribe Tracker/` folder in your vault

## Code Changes Made

- `apps/api/src/obsidian.ts`:
  - Added `findPersonalNote()` - searches for personal notes
  - Added `generateMergedMarkdown()` - combines personal + tracker data
  - Updated `exportToObsidian()` - creates subfolder, merges content
  - Added `startAutoExportScheduler()` - automatic scheduling
  - Added `stopAutoExportScheduler()` - cleanup

- `apps/api/src/index.ts`:
  - Import `startAutoExportScheduler`
  - Call scheduler on server start
  - Restart scheduler when settings change

