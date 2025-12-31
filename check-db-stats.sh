#!/bin/bash

echo "=== Database Statistics Check ==="
echo ""

# Get today's date range
echo "1. Date Range:"
sqlite3 ~/.scribe-tracker/activity.db "
SELECT 
  date('now', 'localtime') as today,
  datetime(MIN(start_ts)/1000, 'unixepoch', 'localtime') as first_event,
  datetime(MAX(end_ts)/1000, 'unixepoch', 'localtime') as last_event
FROM events 
WHERE date(start_ts/1000, 'unixepoch', 'localtime') = date('now', 'localtime');
"

echo ""
echo "2. Total Events and Active Time Today:"
sqlite3 ~/.scribe-tracker/activity.db "
SELECT 
  COUNT(*) as total_events,
  SUM(active_seconds) as total_seconds,
  SUM(active_seconds)/3600 || 'h ' || (SUM(active_seconds)%3600)/60 || 'm' as formatted_time
FROM events 
WHERE date(start_ts/1000, 'unixepoch', 'localtime') = date('now', 'localtime');
"

echo ""
echo "3. Top 5 Applications:"
sqlite3 ~/.scribe-tracker/activity.db "
SELECT 
  app_name,
  SUM(active_seconds) as seconds,
  SUM(active_seconds)/3600 || 'h ' || (SUM(active_seconds)%3600)/60 || 'm' as time
FROM events 
WHERE date(start_ts/1000, 'unixepoch', 'localtime') = date('now', 'localtime')
  AND kind = 'app'
  AND app_name IS NOT NULL
GROUP BY app_name
ORDER BY seconds DESC
LIMIT 5;
"

echo ""
echo "4. Event Count by Kind:"
sqlite3 ~/.scribe-tracker/activity.db "
SELECT kind, COUNT(*) as count
FROM events 
WHERE date(start_ts/1000, 'unixepoch', 'localtime') = date('now', 'localtime')
GROUP BY kind;
"

