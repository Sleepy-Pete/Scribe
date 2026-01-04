# Context Note - 2026-01-03
## Session Summary: AI Summary Improvements for Scribe Activity Tracker

### What We Were Working On
Improving the AI-generated summaries in the Obsidian export to make them more useful and insightful by analyzing window titles and activity patterns.

### Changes Made

#### 1. Enhanced AI Summary Generation (`apps/api/src/ai-summary.ts`)
**Goal**: Generate better, more detailed summaries by analyzing window titles instead of just app names.

**Key Changes**:
- Modified `generateAISummary()` to fetch window titles from the database
- Added new SQL query to get top 50 window titles with occurrence counts for the day
- Updated the AI prompt to analyze window titles and provide:
  - Main activities and projects worked on
  - Specific tasks identified from window titles
  - Work patterns and context switching
  - Productivity insights
  - Time allocation recommendations

**Files Modified**:
- `apps/api/src/ai-summary.ts` - Enhanced summary generation logic
- Database query now pulls: `window_title`, `app_name`, and `occurrences` (count)

#### 2. Database Schema (`shared/database/src/index.ts`)
**Confirmed**: The `events` table already has a `window_title` column (TEXT, nullable), so no schema changes were needed.

### Current Status

#### ✅ Completed
- [x] Enhanced AI summary prompt with window title analysis
- [x] Updated database query to fetch window titles
- [x] Modified data structure passed to AI (now includes window titles)
- [x] Fixed architecture mismatch issue with `better-sqlite3` (ARM64 vs x86_64)

#### ⚠️ Blocked/In Progress
- [ ] **Server not starting properly** - The API server was rebuilt after fixing the `better-sqlite3` architecture issue, but it's not listening on port 3737
- [ ] **Testing needed** - Haven't been able to test the new AI summary output yet

### Technical Issues Encountered

1. **Architecture Mismatch**: 
   - Error: `better-sqlite3` was compiled for ARM64 but Node was trying to use x86_64
   - Solution: Ran `npm rebuild better-sqlite3`
   - Status: Fixed, but server still not starting

2. **Server Not Starting**:
   - Port 3737 is not being bound
   - Need to check terminal output for errors
   - May need to investigate why the server isn't starting after rebuild

### Next Steps (Priority Order)

1. **Debug Server Startup**
   - Check the terminal where `npm run dev:api` is running
   - Look for any error messages or stack traces
   - Verify all dependencies are properly installed
   - Check if there are any TypeScript compilation errors

2. **Test the AI Summary**
   - Once server is running, test with: 
     ```bash
     curl -X POST http://127.0.0.1:3737/api/obsidian/export \
       -H "Content-Type: application/json" \
       -d '{"date":"2026-01-03"}'
     ```
   - Check the generated file: `~/Petros/Scribe Tracker/20260103 - Export.md`
   - Verify the AI summary section includes window title analysis

3. **Validate Data Quality**
   - Confirm window titles are being captured in the database
   - Check if there are enough window titles for meaningful analysis
   - Query to verify: 
     ```sql
     SELECT COUNT(*) FROM events WHERE date(start_ts/1000, 'unixepoch') = '2026-01-03' AND window_title IS NOT NULL;
     ```

4. **Iterate on Prompt**
   - Based on the first test output, refine the AI prompt if needed
   - May need to adjust the number of window titles fetched (currently 50)
   - Consider filtering out noise (e.g., very short-lived windows)

### Code References

**Main file to review**: `apps/api/src/ai-summary.ts`
- Lines ~15-80: The enhanced `generateAISummary()` function
- Lines ~30-40: New SQL query for window titles
- Lines ~50-75: Updated AI prompt with window title analysis instructions

**Database schema**: `shared/database/src/index.ts`
- Line ~51: `window_title TEXT` column definition

**Export endpoint**: `apps/api/src/index.ts`
- Line ~150-200: `/api/obsidian/export` endpoint that calls `generateAISummary()`

### Testing Commands

```bash
# Start the server
npm run dev:api

# Test the export
curl -X POST http://127.0.0.1:3737/api/obsidian/export \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-03"}'

# View the output
cat ~/Petros/Scribe\ Tracker/20260103\ -\ Export.md

# Check window title data
sqlite3 ~/.scribe-tracker/activity.db "SELECT window_title, COUNT(*) as count FROM events WHERE date(start_ts/1000, 'unixepoch') = '2026-01-03' AND window_title IS NOT NULL GROUP BY window_title ORDER BY count DESC LIMIT 20;"
```

### Questions to Answer Tomorrow

1. Why isn't the server starting after the rebuild?
2. Are window titles being captured properly in the database?
3. Does the AI summary provide more useful insights with window title data?
4. Do we need to filter or clean window titles before sending to AI?
5. Is 50 window titles the right amount, or should we adjust?

### Notes
- The AI provider is configured as OpenRouter with model `anthropic/claude-3.5-haiku`
- Database location: `~/.scribe-tracker/activity.db`
- Export location: `~/Petros/Scribe Tracker/`
- Auto-export is scheduled for 18:00 daily

