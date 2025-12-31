import Database from 'better-sqlite3';
import { ActivityEvent, Setting, EventKind, CallProvider } from '@scribe/types';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const DB_DIR = path.join(os.homedir(), '.scribe-tracker');
const DB_PATH = path.join(DB_DIR, 'activity.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize schema
const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT CHECK(kind IN ('app', 'web', 'call')) NOT NULL,
      app_name TEXT,
      process_name TEXT,
      window_title TEXT,
      url TEXT,
      domain TEXT,
      call_provider TEXT CHECK(call_provider IN ('meet', 'discord', 'zoom', 'slack', 'other')),
      start_ts INTEGER NOT NULL,
      end_ts INTEGER NOT NULL,
      active_seconds INTEGER NOT NULL,
      privacy_redacted BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX IF NOT EXISTS idx_events_start_ts ON events(start_ts);
    CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
    CREATE INDEX IF NOT EXISTS idx_events_domain ON events(domain);
    CREATE INDEX IF NOT EXISTS idx_events_app_name ON events(app_name);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initialize default settings
  const defaultSettings = [
    { key: 'polling_interval_ms', value: '1000' },
    { key: 'idle_timeout_seconds', value: '60' },
    { key: 'privacy_mode', value: 'false' },
    { key: 'obsidian_vault_path', value: '/Users/Peter/Petros' },
    { key: 'obsidian_auto_export', value: 'true' },
    { key: 'obsidian_export_time', value: '18:00' }
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const setting of defaultSettings) {
    insertSetting.run(setting.key, setting.value);
  }
};

initSchema();

// Event operations
export const insertEvent = (event: Omit<ActivityEvent, 'id'>): number => {
  const stmt = db.prepare(`
    INSERT INTO events (kind, app_name, process_name, window_title, url, domain, call_provider, start_ts, end_ts, active_seconds, privacy_redacted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    event.kind,
    event.app_name || null,
    event.process_name || null,
    event.window_title || null,
    event.url || null,
    event.domain || null,
    event.call_provider || null,
    event.start_ts,
    event.end_ts,
    event.active_seconds,
    event.privacy_redacted ? 1 : 0
  );

  return result.lastInsertRowid as number;
};

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

  if (fields.length === 0) return;

  values.push(id);
  const stmt = db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
};

export const getEventById = (id: number): ActivityEvent | null => {
  const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;
  return rowToEvent(row);
};

export const getEventsSince = (startTs: number): ActivityEvent[] => {
  const stmt = db.prepare('SELECT * FROM events WHERE start_ts >= ? ORDER BY start_ts ASC');
  const rows = stmt.all(startTs) as any[];
  return rows.map(rowToEvent);
};

export const getEventsInRange = (startTs: number, endTs: number): ActivityEvent[] => {
  const stmt = db.prepare('SELECT * FROM events WHERE start_ts >= ? AND start_ts < ? ORDER BY start_ts ASC');
  const rows = stmt.all(startTs, endTs) as any[];
  return rows.map(rowToEvent);
};

export const getCallEvents = (startTs: number, endTs: number): ActivityEvent[] => {
  const stmt = db.prepare('SELECT * FROM events WHERE kind = ? AND start_ts >= ? AND start_ts < ? ORDER BY start_ts ASC');
  const rows = stmt.all('call', startTs, endTs) as any[];
  return rows.map(rowToEvent);
};

// Settings operations
export const getSetting = (key: string): string | null => {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key) as any;
  return row ? row.value : null;
};

export const setSetting = (key: string, value: string): void => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
};

export const getAllSettings = (): Setting[] => {
  const stmt = db.prepare('SELECT * FROM settings');
  return stmt.all() as Setting[];
};

// Helper function to convert database row to ActivityEvent
const rowToEvent = (row: any): ActivityEvent => {
  return {
    id: row.id,
    kind: row.kind as EventKind,
    app_name: row.app_name,
    process_name: row.process_name,
    window_title: row.window_title,
    url: row.url,
    domain: row.domain,
    call_provider: row.call_provider as CallProvider | undefined,
    start_ts: row.start_ts,
    end_ts: row.end_ts,
    active_seconds: row.active_seconds,
    privacy_redacted: row.privacy_redacted === 1
  };
};

export const getDatabase = (): Database.Database => db;

export { DB_PATH };

