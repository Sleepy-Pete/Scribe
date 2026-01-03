import Database from 'better-sqlite3';
import * as os from 'os';
import * as path from 'path';

const DB_PATH = path.join(os.homedir(), '.scribe-tracker', 'activity.db');
const db = new Database(DB_PATH);

console.log('🧹 Cleaning up duplicate events...');
console.log(`📂 Database: ${DB_PATH}`);

// Get count before cleanup
const beforeCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
console.log(`\n📊 Events before cleanup: ${beforeCount.count}`);

// Find and remove duplicates
// Keep the event with the lower ID (first inserted) for each duplicate group
const result = db.prepare(`
  DELETE FROM events
  WHERE id NOT IN (
    SELECT MIN(id)
    FROM events
    GROUP BY start_ts, end_ts, kind, app_name, window_title, active_seconds
  )
`).run();

console.log(`\n✅ Removed ${result.changes} duplicate events`);

// Get count after cleanup
const afterCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
console.log(`📊 Events after cleanup: ${afterCount.count}`);

// Show some recent events to verify
console.log('\n📋 Recent events (last 10):');
const recentEvents = db.prepare(`
  SELECT 
    id,
    datetime(start_ts/1000, 'unixepoch', 'localtime') as start,
    active_seconds,
    kind,
    app_name
  FROM events
  ORDER BY start_ts DESC
  LIMIT 10
`).all();

recentEvents.forEach((event: any) => {
  console.log(`  ${event.id}: ${event.start} | ${event.active_seconds}s | ${event.kind} | ${event.app_name}`);
});

db.close();
console.log('\n✨ Cleanup complete!');

