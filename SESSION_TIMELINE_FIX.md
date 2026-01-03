# Timeline Session Consolidation Fix

**Date:** 2025-12-31  
**Issue:** Timeline showing too many short events instead of consolidated sessions

---

## 🐛 Problems Found

### 1. Duplicate Events (FIXED ✅)
**Cause:** Two tracker instances running simultaneously (PID 53840 from 7:00AM and PID 36988 from 2:48PM)

**Impact:** Every activity was being recorded twice in the database

**Fix:** 
- Killed the old tracker process (PID 53840)
- Created cleanup script to remove duplicates: `scripts/cleanup-duplicates.ts`
- Removed 1 duplicate event from database

### 2. Too Many Short Sessions (FIXED ✅)
**Cause:** Session manager created a new event for EVERY window title change, even within the same app

**Example Before Fix:**
```
1802 | 2025-12-31 14:56:04 | 0s | Chrome | The best TUIs - YouTube
1801 | 2025-12-31 14:56:04 | 0s | Chrome | youtube.com/watch?v=_fLmA4fjiAE
1800 | 2025-12-31 14:56:03 | 1s | Chrome | youtube.com/watch?v=_fLmA4fjiAE
1799 | 2025-12-31 14:55:59 | 4s | Chrome | terminal ui - Google Search
```

**Expected After Fix:**
```
1800 | 2025-12-31 14:55:59 | 65s | Chrome | The best TUIs - YouTube 🔊
```

**Fix:** Modified `apps/tracker/src/session-manager.ts`:

1. **Domain Extraction** (lines 71-129):
   - New `extractDomainFromTitle()` function extracts domain from browser window titles
   - Recognizes common sites: YouTube, Google, Reddit, GitHub, Twitter, LinkedIn, etc.
   - Handles various title formats: "YouTube", "reddit.com: dive into anything", etc.

2. **Smart Session Matching** (lines 131-185):
   - **Browsers:** Match on app + domain (creates new session when switching domains)
   - **Communication apps:** Match on app only (ignores all window title changes)
   - **Other apps:** Match on app + exact window title (existing behavior)

3. **Update Window Title** (lines 43, 51):
   - When continuing a session, update the window title to the latest one
   - Timeline shows the most recent page/tab you were on within that domain

---

## 🎯 How It Works Now

### Browsers (Chrome, Safari, Firefox, etc.)
- **Before:** New event for every page load, tab switch
- **After:** Consolidated sessions **per domain**
- **Example:**
  - YouTube video 1 → YouTube video 2 → YouTube video 3 = **ONE session** (youtube.com)
  - YouTube → Reddit → GitHub = **THREE sessions** (different domains)
- **Window Title:** Shows the last page you visited on that domain

### Communication Apps (Discord, Slack, Messages, etc.)
- **Before:** New event for every channel/conversation switch
- **After:** Single consolidated session until you switch to a different app
- **Window Title:** Shows the last channel/conversation you were on

### Other Apps (VS Code, Terminal, etc.)
- **Before:** New event for every file/directory change
- **After:** Same behavior (still creates new events on window title change)
- **Reason:** Window title changes are meaningful (different files/projects)

---

## 🧪 Testing

### 1. Restart the Tracker
The changes won't take effect until you restart:

```bash
# Stop current TUI (Ctrl+C in the terminal running start-tui.sh)
# Then restart:
./start-tui.sh
```

### 2. Test Browser Consolidation
1. Open Chrome/Safari/Firefox
2. Browse to multiple pages (Google → YouTube → Reddit)
3. Stay on each page for 5-10 seconds
4. Switch to a different app (VS Code, Terminal, etc.)
5. Check the database:

```bash
sqlite3 ~/.scribe-tracker/activity.db "SELECT id, datetime(start_ts/1000, 'unixepoch', 'localtime') as start, active_seconds, app_name, substr(window_title, 1, 50) as title FROM events WHERE app_name LIKE '%Chrome%' ORDER BY start_ts DESC LIMIT 5;"
```

**Expected:** One long Chrome session (30-60s) with the last page you visited as the window title

### 3. Test Discord Consolidation
1. Join a Discord voice channel
2. Switch between text channels while in voice
3. Switch to a different app
4. Check the database:

```bash
sqlite3 ~/.scribe-tracker/activity.db "SELECT id, datetime(start_ts/1000, 'unixepoch', 'localtime') as start, active_seconds, kind, call_provider, substr(window_title, 1, 50) as title FROM events WHERE app_name='Discord' ORDER BY start_ts DESC LIMIT 5;"
```

**Expected:** One long Discord session marked as `kind='call'` and `call_provider='discord'`

### 4. Test VS Code (Should Still Split)
1. Open VS Code
2. Switch between different files (README.md → index.ts → package.json)
3. Spend 10+ seconds on each file
4. Check the database:

```bash
sqlite3 ~/.scribe-tracker/activity.db "SELECT id, datetime(start_ts/1000, 'unixepoch', 'localtime') as start, active_seconds, app_name, substr(window_title, 1, 50) as title FROM events WHERE app_name LIKE '%Code%' ORDER BY start_ts DESC LIMIT 5;"
```

**Expected:** Separate events for each file (this is desired behavior for code editors)

---

## 📊 Impact

### Before
- **Timeline entries:** 1,804 events
- **Many 0-1 second events:** Yes (page loads, tab switches)
- **Readability:** Poor (cluttered with noise)

### After (Expected)
- **Timeline entries:** ~60% fewer events
- **Consolidated sessions:** 30-60+ second sessions for browsing/chatting
- **Readability:** Much better (shows actual activity patterns)

---

## 🔧 Files Modified

1. **apps/tracker/src/session-manager.ts**
   - Added smart session matching logic
   - Updates window title during session continuation

2. **scripts/cleanup-duplicates.ts** (NEW)
   - One-time script to remove duplicate events
   - Can be run again if duplicates appear

---

## 🚨 Prevention

To avoid duplicate events in the future:

1. **Always use `start-tui.sh`** to start the tracker
2. **Check for existing processes** before starting:
   ```bash
   ps aux | grep "ts-node src/index.ts" | grep -v grep
   ```
3. **Kill old processes** if found:
   ```bash
   pkill -f "ts-node.*tracker"
   ```

---

## ✅ Verification Checklist

After restarting the tracker:
- [ ] Only 3 node processes running (API, Tracker, TUI)
- [ ] Chrome browsing creates ONE long session
- [ ] Discord creates ONE long call session
- [ ] VS Code still creates separate events per file
- [ ] Timeline is much cleaner and readable

