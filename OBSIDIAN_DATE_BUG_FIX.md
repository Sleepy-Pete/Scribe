# Obsidian Export Date Bug Fix - December 31, 2025

## 🔴 Critical Bug Fixed

### Problem
The Obsidian export was showing the **wrong date** due to UTC/local timezone mismatch.

**Example:**
- Request: `date=2025-12-31`
- Expected: "Wednesday, December 31, 2025"
- **Actual (BEFORE FIX)**: "Tuesday, December 30, 2025" ❌
- **Actual (AFTER FIX)**: "Wednesday, December 31, 2025" ✅

### Root Cause
The code was using `new Date(date)` to parse date strings like "2025-12-31". This creates a **UTC date** at midnight UTC, which in PST (UTC-8) is actually the **previous day** at 4:00 PM.

```javascript
// BEFORE (WRONG):
const dateObj = new Date(date); // "2025-12-31" → Dec 30, 4:00 PM PST

// AFTER (CORRECT):
const [year, month, day] = date.split('-').map(Number);
const dateObj = new Date(year, month - 1, day); // Dec 31, 12:00 AM PST
```

---

## ✅ Files Modified

### 1. `apps/api/src/obsidian.ts`

#### Change 1: `generateDailyMarkdown()` function (lines 83-98)
**Before:**
```typescript
export function generateDailyMarkdown(date: string, events: ActivityEvent[]): string {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
```

**After:**
```typescript
export function generateDailyMarkdown(date: string, events: ActivityEvent[]): string {
  // Parse date in local timezone to avoid UTC offset issues
  // date format is "YYYY-MM-DD"
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day); // month is 0-indexed
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
```

#### Change 2: `exportToObsidian()` function (lines 208-225)
**Before:**
```typescript
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
```

**After:**
```typescript
    // Parse date in local timezone to avoid UTC offset issues
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    const startOfDay = dateObj.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
```

### 2. `apps/api/src/index.ts`

#### Change: `/api/export/obsidian` endpoint (lines 345-364)
**Before:**
```typescript
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
```

**After:**
```typescript
    // Parse date in local timezone to avoid UTC offset issues
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    const startOfDay = dateObj.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
```

---

## 🧪 Testing Results

### Before Fix:
```bash
$ curl "http://127.0.0.1:3737/api/export/obsidian?date=2025-12-31" | head -5
# Daily Summary - Tuesday, December 30, 2025  ❌ WRONG DATE

## Stats
- **Total active time:** 7m  ❌ WRONG DATA (yesterday's data)
```

### After Fix:
```bash
$ curl "http://127.0.0.1:3737/api/export/obsidian?date=2025-12-31" | head -5
# Daily Summary - Wednesday, December 31, 2025  ✅ CORRECT DATE

## Stats
- **Total active time:** 2h 51m  ✅ CORRECT DATA (today's data)
```

### File Export Test:
```bash
$ curl -X POST "http://127.0.0.1:3737/api/obsidian/export" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-12-31"}'

{
  "success": true,
  "message": "Successfully exported to Obsidian",
  "file_path": "/Users/Peter/Petros/20251231.md"
}

$ head -5 /Users/Peter/Petros/20251231.md
# Daily Summary - Wednesday, December 31, 2025  ✅ CORRECT

## Stats
- **Total active time:** 2h 51m  ✅ CORRECT
```

---

## 📝 Additional Fixes

### Missing Files Restored
- ✅ `dashboard.html` - Created simplified landing page with API status check

### Build & Deployment
```bash
cd apps/api
npm run build
# Restart API server to load new code
```

---

## 💡 Key Learnings

1. **Always use local timezone for date parsing** when dealing with date strings in "YYYY-MM-DD" format
2. **`new Date(dateString)` creates UTC dates**, which can cause off-by-one-day errors in different timezones
3. **Use `new Date(year, month, day)` for local timezone** date creation
4. **Test timezone-sensitive code** in different timezones or at different times of day

---

## ✅ Status: FIXED AND TESTED

All Obsidian export date issues have been resolved. The export now correctly:
- Shows the requested date (not the previous day)
- Exports data for the correct day
- Works correctly across timezone boundaries

