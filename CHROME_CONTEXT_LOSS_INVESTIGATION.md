# 🔍 Chrome Context Loss Investigation & Root Cause Analysis

**Date:** 2026-01-02  
**Issue:** Chrome activities showing only "Google Chrome" with no page titles or context  
**Status:** 🐛 **ROOT CAUSE IDENTIFIED** - Critical Bug in Session Consolidation

---

## 📊 Executive Summary

Chrome window titles **ARE being captured** by the tracker, but they're **NOT being saved to the database** due to a bug introduced during session consolidation implementation.

### Key Findings

1. ✅ **Screen Recording Permission**: Working correctly (verified with AppleScript)
2. ✅ **active-win Library**: Capturing Chrome titles (AppleScript confirms: "Twelve Principles of Animation")
3. ✅ **Tracker Code**: Receiving window titles from active-win
4. ❌ **Database Update**: **BROKEN** - `window_title` updates are silently failing
5. ❌ **Result**: Database has empty `window_title` fields for Chrome sessions

---

## 🐛 The Bug: Missing Database Field Update

### Location
**File:** `shared/database/src/index.ts`  
**Function:** `updateEvent()`  
**Lines:** 88-114

### The Problem

The `updateEvent()` function only supports updating these fields:
- `end_ts` ✅
- `active_seconds` ✅
- `call_provider` ✅
- `kind` ✅
- `window_title` ❌ **MISSING!**

### The Code

```typescript
// shared/database/src/index.ts (lines 88-114)
export const updateEvent = (id: number, updates: Partial<ActivityEvent>): void => {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.end_ts !== undefined) {
    fields.push('end_ts = ?');
    values.push(updates.end_ts);
  }
  if (updates.active_seconds !== undefined) {
    fields.push('active_seconds = ?');
    values.push(updates.active_seconds);
  }
  if (updates.call_provider !== undefined) {
    fields.push('call_provider = ?');
    values.push(updates.call_provider);
  }
  if (updates.kind !== undefined) {
    fields.push('kind = ?');
    values.push(updates.kind);
  }
  
  // ❌ window_title is MISSING!

  if (fields.length === 0) return;

  values.push(id);
  const stmt = db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
};
```

### What Session Manager Tries to Do

```typescript
// apps/tracker/src/session-manager.ts (lines 50-54)
updateEvent(this.currentSession.eventId, {
  window_title: sanitizedWindowTitle,  // ❌ This is IGNORED!
  end_ts: now,                          // ✅ This works
  active_seconds: activeSeconds         // ✅ This works
});
```

**Result:** The `window_title` field is passed to `updateEvent()` but silently ignored because there's no handler for it!

---

## 🕰️ Timeline: When Did This Break?

### Before Session Consolidation (Working)
- Each page change created a NEW event
- `window_title` was set during `insertEvent()` ✅
- Database had full window titles ✅

### After Session Consolidation (Broken)
- **Date:** 2025-12-31 (SESSION_TIMELINE_FIX.md)
- Sessions are consolidated by domain
- `window_title` is updated via `updateEvent()` ❌
- Database updates fail silently ❌
- Only the FIRST window title is saved (from `insertEvent()`)
- All subsequent updates are lost

---

## 🎯 Why Chrome Appears Broken But Other Apps Don't

### Chrome Behavior
1. User opens Chrome → Creates event with empty title (New Tab)
2. User navigates to "Twelve Principles of Animation"
3. Session manager tries to update title → **FAILS SILENTLY**
4. Database still has empty title from step 1
5. TUI shows "Google Chrome" with no context

### VS Code Behavior
1. User opens VS Code → Creates event with "Welcome — Scribe"
2. User opens different file → Creates NEW event (not consolidated)
3. Each event has correct title from `insertEvent()`
4. TUI shows full context

**Why the difference?**
- Browsers are consolidated by domain (uses `updateEvent`)
- Other apps create new events per window title (uses `insertEvent`)
- `insertEvent` works ✅, `updateEvent` is broken ❌

---

## 🔧 The Fix

### Step 1: Add `window_title` Support to `updateEvent()`

**File:** `shared/database/src/index.ts`

```typescript
export const updateEvent = (id: number, updates: Partial<ActivityEvent>): void => {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.end_ts !== undefined) {
    fields.push('end_ts = ?');
    values.push(updates.end_ts);
  }
  if (updates.active_seconds !== undefined) {
    fields.push('active_seconds = ?');
    values.push(updates.active_seconds);
  }
  if (updates.call_provider !== undefined) {
    fields.push('call_provider = ?');
    values.push(updates.call_provider);
  }
  if (updates.kind !== undefined) {
    fields.push('kind = ?');
    values.push(updates.kind);
  }
  
  // ✅ ADD THIS:
  if (updates.window_title !== undefined) {
    fields.push('window_title = ?');
    values.push(updates.window_title);
  }

  if (fields.length === 0) return;

  values.push(id);
  const stmt = db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
};
```

### Step 2: Rebuild and Restart

```bash
# Rebuild database module
cd shared/database && npm run build && cd ../..

# Restart tracker
# (Quit TUI with 'q', then restart)
./start-tui.sh
```

### Step 3: Test

```bash
# Browse some websites in Chrome
# Then check database:
sqlite3 ~/.scribe-tracker/activity.db "SELECT id, datetime(start_ts/1000, 'unixepoch', 'localtime') as start, active_seconds, app_name, window_title FROM events WHERE app_name LIKE '%Chrome%' ORDER BY start_ts DESC LIMIT 5;"
```

**Expected:** Window titles should now appear!

---

## 📝 Next Session Action Items

### Priority 1: Fix the Bug ⚠️
- [ ] Add `window_title` to `updateEvent()` function
- [ ] Rebuild database module
- [ ] Restart tracker
- [ ] Verify Chrome titles appear in database
- [ ] Verify TUI shows Chrome context

### Priority 2: Prevent Similar Bugs
- [ ] Add TypeScript strict mode to catch missing fields
- [ ] Add unit tests for `updateEvent()` with all fields
- [ ] Add integration test for session consolidation
- [ ] Add logging when `updateEvent()` receives unknown fields

### Priority 3: Consider Architecture Improvements
- [ ] Make `updateEvent()` generic (update any field)
- [ ] Add validation to ensure all fields in `Partial<ActivityEvent>` are handled
- [ ] Add database migration system for schema changes

---

## 🎓 Lessons Learned

1. **Silent Failures Are Dangerous**: `updateEvent()` silently ignored unknown fields
2. **Test After Refactoring**: Session consolidation wasn't fully tested
3. **Type Safety Isn't Enough**: TypeScript allowed `Partial<ActivityEvent>` but runtime ignored fields
4. **Integration Tests Matter**: Unit tests wouldn't catch this cross-module bug

---

## 🔍 Additional Notes

### Why AppleScript Worked
AppleScript directly queries Chrome's window title via macOS APIs, bypassing the tracker entirely. This confirmed Chrome HAS titles, proving the issue was in our code, not permissions.

### Why Screen Recording Permission Seemed Suspicious
The symptoms (empty titles for Chrome but not other apps) matched the Screen Recording permission issue pattern. However, the real cause was the database update bug affecting only consolidated sessions (browsers).

### User's Insight Was Correct
> "it was working earlier for chrome but now its not probably related to the condensing of information"

**100% correct!** The session consolidation feature introduced the bug by relying on `updateEvent()` which didn't support `window_title`.

---

## ✅ FIX IMPLEMENTED (2026-01-02)

### Changes Made

1. **Updated `shared/database/src/index.ts`** (lines 107-110)
   - Added `window_title` field support to `updateEvent()` function
   - Now properly updates window titles during session consolidation

2. **Rebuilt database module**
   - Compiled TypeScript to JavaScript
   - Changes ready to use

### Testing Required

**IMPORTANT:** The tracker must be restarted for changes to take effect!

```bash
# 1. Quit the TUI (press 'q')

# 2. Restart everything
./start-tui.sh

# 3. Browse some websites in Chrome for 30 seconds

# 4. Check if titles are now being saved:
sqlite3 ~/.scribe-tracker/activity.db "SELECT id, datetime(start_ts/1000, 'unixepoch', 'localtime') as start, active_seconds, app_name, substr(window_title, 1, 60) as title FROM events WHERE app_name LIKE '%Chrome%' ORDER BY start_ts DESC LIMIT 5;"
```

**Expected Result:** You should see actual page titles instead of empty strings!

### What Should Happen Now

1. **Chrome sessions will consolidate by domain** (as designed)
2. **Window titles will update** as you browse within the same domain
3. **TUI will show context** - the last page title you visited on each domain
4. **Database will have full titles** for all Chrome activities

### Example

**Before Fix:**
```
Google Chrome | 03:02 PM-03:05 PM | 3m
  (no context shown)
```

**After Fix:**
```
Google Chrome | 03:02 PM-03:05 PM | 3m
  Twelve Principles of Animation
```

---

**Status:** ✅ **FIX IMPLEMENTED** - Awaiting restart and testing

---

## 🔍 FOLLOW-UP INVESTIGATION (2026-01-03)

### What We Found

The `updateEvent()` fix is **correctly in place**, but Chrome titles are STILL empty. Further investigation revealed:

```
[SessionManager] Browser session check: windowTitle=""
```

**The `active-win` library is returning empty strings for Chrome!**

### Diagnosis

| Check | Result |
|-------|--------|
| AppleScript gets Chrome title | ✅ "Reimagined: A Virtual Reality Animation Series" |
| active-win gets Chrome title | ❌ (empty string) |
| Tracker logs show | `windowTitle=""` |

### Root Cause: Screen Recording Permission

The tracker is running under **Terminal.app**, which appears to lack proper **Screen Recording** permission. On macOS 10.15+, `active-win` requires Screen Recording permission to read window titles from other applications (like Chrome).

**Process chain:**
```
Terminal.app → login → bash → npm → node → tracker
```

### The Fix

1. **Open System Settings** → **Privacy & Security** → **Screen Recording**
2. Find **Terminal** in the list
3. **Toggle OFF then ON** (macOS sometimes caches old permission state)
4. **Fully Quit Terminal.app** (Cmd+Q, not just close windows)
5. Reopen Terminal and restart: `./start-tui.sh`

### Alternative: Run in VS Code Terminal

If you're running from VS Code's integrated terminal, you need to grant Screen Recording permission to **Visual Studio Code** instead.

### Why AppleScript Works But active-win Doesn't

- **AppleScript** uses Automation/Accessibility permissions (different permission type)
- **active-win** uses CGWindowListCopyWindowInfo, which requires Screen Recording permission
- These are separate permission categories in macOS

---

## ✅ FINAL FIX IMPLEMENTED (2026-01-03)

### The Real Root Cause

**NOT a permission issue!** This is a **known bug in `active-win`** library:
- GitHub Issue: https://github.com/sindresorhus/get-windows/issues/188
- Affects Chrome on macOS (started ~September 2024)
- `active-win` returns empty `title` but **DOES return `url`** for Chrome windows

### The Solution: URL Fallback

Modified `apps/tracker/src/index.ts` to use URL as fallback when title is empty:

```typescript
// active-win returns url for browsers but TypeScript types don't include it
const url = (window as any).url as string | undefined;

// Use title, or fall back to URL for browsers (workaround for active-win Chrome bug)
let windowTitle = title || '';
if (!windowTitle && url) {
  try {
    const urlObj = new URL(url);
    windowTitle = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
  } catch {
    windowTitle = url;
  }
}
```

### Results

**Before:**
```
Google Chrome | 10:09 PM-10:22 PM | 13m
  (no context)
```

**After:**
```
Google Chrome | 10:32 PM-10:45 PM | 13m
  www.youtube.com/watch
```

### Verification

```bash
sqlite3 ~/.scribe-tracker/activity.db "SELECT datetime(start_ts/1000, 'unixepoch', 'localtime'), window_title FROM events WHERE app_name LIKE '%Chrome%' ORDER BY start_ts DESC LIMIT 5;"
```

**Status:** ✅ **FIXED** - Chrome URLs now captured as fallback titles

