# 🚀 START HERE - Next Session Quick Reference

**Last Updated**: 2025-12-31 05:00 AM  
**Status**: ✅ Bugs Fixed, ⚠️ Needs Restart to Apply

---

## ⚡ IMMEDIATE ACTION REQUIRED

### The TUI is showing OLD data because the API server is running OLD code!

**Quick Fix**:
```bash
# 1. Quit TUI (press 'q')
# 2. Verify API is stopped
curl http://127.0.0.1:3737/health  # Should fail

# 3. If still running, force kill
lsof -ti :3737 | xargs kill -9

# 4. Restart everything
./start-tui.sh
```

---

## 🐛 What Was Fixed

### Critical Bugs (All Fixed ✅):
1. **Timeline tags** - Added `tags: true` to render styled text
2. **Wrong SQL query** - Changed `end_ts <= ?` to `start_ts < ?` in database module
3. **Timezone bug** - Fixed stats API to use local time instead of UTC
4. **Inconsistent date calc** - Standardized date range across endpoints

### Files Changed:
- `apps/tui/src/views/timeline.ts` (line 60)
- `shared/database/src/index.ts` (lines 130, 136) - **REBUILT**
- `apps/api/src/index.ts` (lines 143-151)

---

## 📊 Expected Results After Restart

| Metric | Before | After |
|--------|--------|-------|
| Active Time | 7m 20s | ~2h 35m |
| App Switches | 28 | ~1,064 |
| Top App (Chrome) | Wrong | 1h 25m |
| Top App (Code) | Wrong | 56m |

---

## ✅ Verification Steps

After restarting, verify:

1. **Statistics Tab** shows ~2h 35m active time
2. **Timeline Tab** shows styled/colored text (not raw tags)
3. **Top Applications** shows Chrome, Code, Terminal with correct times
4. **App Switches** shows ~1,064

If still wrong, check:
```bash
# Is API running the new code?
ps aux | grep "ts-node.*api"

# What does API return?
curl -s http://127.0.0.1:3737/api/stats/daily | python3 -m json.tool

# What's in database?
sqlite3 ~/.scribe-tracker/activity.db "
SELECT COUNT(*), SUM(active_seconds) 
FROM events 
WHERE date(start_ts/1000, 'unixepoch', 'localtime') = date('now', 'localtime');
"
```

---

## 📚 Full Details

See `SESSION_2025-12-31_TUI_STATS_FIXES.md` for complete technical details.

---

## 🚧 Known Issues (Not Bugs)

- **"No websites recorded"** - This is EXPECTED. Web tracking requires browser extension which doesn't exist yet. See README line 10: "Website Tracking: Track browser activity (requires browser extension - coming soon)"

---

## 🧹 Cleanup (Optional)

After verifying everything works, you can delete:
```bash
rm test-date-range.js
rm test-api-stats.sh
rm check-db-stats.sh
```

---

## 🎯 If Stats Still Wrong After Restart

1. Check which code is running:
   ```bash
   # View the actual running API code
   ps aux | grep ts-node
   ```

2. Check API logs:
   ```bash
   tail -20 logs/api.log
   ```

3. Manually test the database query:
   ```bash
   node -e "
   const { getEventsInRange } = require('./shared/database/dist/index.js');
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
   const end = start + 24*60*60*1000;
   const events = getEventsInRange(start, end);
   console.log('Events:', events.length);
   console.log('Total seconds:', events.reduce((s,e) => s + e.active_seconds, 0));
   "
   ```

4. If database module wasn't rebuilt:
   ```bash
   cd shared/database
   npm run build
   cd ../..
   # Then restart TUI
   ```

---

## 💡 Remember

**Node.js processes don't auto-reload code!** Any time you edit source files, you MUST restart the processes to see changes. The `start-tui.sh` script handles this by killing old processes and starting fresh ones.

