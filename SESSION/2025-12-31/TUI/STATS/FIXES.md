# Session Summary: TUI Statistics Bug Fixes
**Date**: 2025-12-31  
**Focus**: Fixed critical bugs in statistics display and data retrieval

---

## 🐛 Issues Reported

1. **Timeline tags showing raw markup** - Tags like `{bold}{cyan-fg}` appearing as text instead of styled
2. **"No websites recorded"** - Top Websites section always empty
3. **Statistics not updating** - Stats tab showing stale/incorrect data (7m 20s instead of 2h 35m)
4. **Wrong app switches count** - Showing 28 instead of ~1,064
5. **Incorrect app times and percentages** - Top Applications showing wrong durations

---

## 🔍 Root Causes Identified

### Bug #1: Timeline Tags Not Rendering
**File**: `apps/tui/src/views/timeline.ts`  
**Issue**: Timeline list widget missing `tags: true` property  
**Impact**: Colored/styled text showing as raw tag strings

### Bug #2: No Web Events (NOT A BUG - Feature Not Implemented)
**Finding**: Web tracking requires browser extension which doesn't exist yet  
**Evidence**: Database has ZERO web events (`kind='web'`)  
**Status**: Documented in README as "coming soon"

### Bug #3: Wrong SQL Query in Database Module ⚠️ CRITICAL
**File**: `shared/database/src/index.ts` (lines 130, 136)  
**Problem**:
```sql
-- OLD (WRONG):
WHERE start_ts >= ? AND end_ts <= ?
```
This excludes events that:
- Started today but are still active (end_ts in future)
- Started today but ended after midnight
- Result: Only ~28 events returned instead of 1,064

**Fix**:
```sql
-- NEW (CORRECT):
WHERE start_ts >= ? AND start_ts < ?
```
Includes ALL events that started during the day, regardless of end time.

### Bug #4: Timezone Issue in Stats API
**File**: `apps/api/src/index.ts` (line 143-151)  
**Problem**: Used `new Date().toISOString()` which returns UTC date  
**Impact**: In PST (UTC-8), at 4:59 AM local time, UTC is already next day  
**Fix**: Changed to use local timezone for date calculations

### Bug #5: Inconsistent Date Range Calculation
**File**: `apps/api/src/index.ts`  
**Problem**: Stats endpoint used different `endOfDay` calculation than timeline endpoint  
**Fix**: Standardized both to use `startOfDay + 24 * 60 * 60 * 1000`

---

## ✅ Files Modified

### 1. `apps/tui/src/views/timeline.ts`
- **Line 60**: Added `tags: true` to timeline list widget
- **Impact**: Timeline now renders colored/styled text correctly

### 2. `shared/database/src/index.ts`
- **Line 130**: Changed `getEventsInRange` query from `end_ts <= ?` to `start_ts < ?`
- **Line 136**: Changed `getCallEvents` query from `end_ts <= ?` to `start_ts < ?`
- **Impact**: Now returns ALL events that started during the day
- **Rebuilt**: `cd shared/database && npm run build`

### 3. `apps/api/src/index.ts`
- **Lines 143-151**: Fixed `/api/stats/daily` endpoint date calculation
  - Changed from UTC to local timezone
  - Standardized `endOfDay` calculation to match timeline endpoint
- **Impact**: Stats now query correct date range in local time

---

## 📊 Expected Results After Restart

### Before Fixes:
- Active Time: 7m 20s
- App Switches: 28
- Top Apps: Limited/incorrect data

### After Fixes:
- Active Time: ~2h 35m (9,352 seconds)
- App Switches: ~1,064
- Top Apps: 
  - Google Chrome: 1h 25m (5,102s)
  - Code: 56m (3,372s)
  - Terminal: 12m (739s)
  - Discord: 41s
  - Music: 34s

---

## 🔄 How to Apply Fixes

### IMPORTANT: Code Changes Require Restart!

The `start-tui.sh` script starts API and tracker as **background processes**. They load code into memory at startup and don't auto-reload when source files change.

**Current State**:
- ✅ Source files on disk: Have bug fixes
- ❌ Running processes: Still executing OLD code

**To Apply Fixes**:
```bash
# 1. Quit TUI (press 'q')
#    This kills API and tracker processes

# 2. Verify API is down
curl http://127.0.0.1:3737/health
# Should see: "Connection refused"

# 3. If still running, force kill
lsof -ti :3737 | xargs kill -9

# 4. Restart with new code
./start-tui.sh
```

---

## 🧪 Verification Commands

### Check Database Stats Directly:
```bash
# Total events and time today
sqlite3 ~/.scribe-tracker/activity.db "
SELECT 
  COUNT(*) as events,
  SUM(active_seconds) as seconds
FROM events 
WHERE date(start_ts/1000, 'unixepoch', 'localtime') = date('now', 'localtime');
"

# Top apps
sqlite3 ~/.scribe-tracker/activity.db "
SELECT 
  app_name,
  SUM(active_seconds) as seconds
FROM events 
WHERE date(start_ts/1000, 'unixepoch', 'localtime') = date('now', 'localtime')
  AND kind = 'app'
GROUP BY app_name
ORDER BY seconds DESC
LIMIT 5;
"
```

### Check API Response:
```bash
curl -s http://127.0.0.1:3737/api/stats/daily | python3 -m json.tool
```

---

## 📝 Key Learnings

1. **SQL Query Design**: Using `end_ts` in range queries can exclude active/long-running events
2. **Timezone Handling**: Always use local timezone for user-facing date calculations
3. **Process Management**: Background processes don't auto-reload code changes
4. **Debugging Strategy**: Compare database queries directly vs API responses to isolate issues

---

## 🚧 Known Limitations (Unchanged)

- ⚠️ No browser extension - website tracking not implemented
- ⚠️ macOS only
- ⚠️ No background service (must run manually)
- ⚠️ Privacy mode exists but not exposed in UI

---

## 📂 Test Files Created

- `test-date-range.js` - Date range calculation test
- `test-api-stats.sh` - API stats endpoint test
- `check-db-stats.sh` - Database statistics verification

These can be deleted after verification.

---

## 🎯 Next Steps

1. **Restart TUI** to apply all fixes
2. **Verify stats** match database values
3. **Test timeline** tags render correctly
4. **Consider implementing** browser extension for web tracking (future feature)
5. **Add error handling** to TUI for API failures (currently fails silently)

---

## 💡 Future Improvements Suggested

1. Add retry logic in TUI when API is unavailable
2. Show loading states instead of stale data
3. Add health check indicator in TUI header
4. Implement hot-reload for development
5. Add unit tests for date range calculations
6. Document the "no web tracking" limitation more prominently in UI

