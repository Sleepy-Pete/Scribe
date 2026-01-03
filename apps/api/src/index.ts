import express from 'express';
import cors from 'cors';
import {
  getEventsInRange,
  getCallEvents,
  getSetting,
  setSetting,
  getAllSettings,
  insertEvent,
  getAvailableDates,
  DB_PATH
} from '@scribe/database';
import { ActivityEvent, DailyStats, TimelineBlock } from '@scribe/types';
import { exportToObsidian, generateDailyMarkdown, getObsidianSettings, startAutoExportScheduler } from './obsidian';

const app = express();
const PORT = 3737;

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Root route - redirect to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const dashboardPath = path.join(__dirname, '../../../dashboard.html');

  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scribe Activity Tracker</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
          h1 { margin: 0 0 20px 0; font-size: 48px; }
          p { font-size: 18px; margin: 10px 0; }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
          }
          .status { color: #34c759; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Scribe Activity Tracker</h1>
          <p class="status">✅ API Server Running</p>
          <p>Database: ${DB_PATH}</p>
          <p>Dashboard not found at expected location.</p>
          <p>Please open <code>dashboard.html</code> directly in your browser.</p>
          <a href="/api/stats/daily">View API Stats</a>
        </div>
      </body>
      </html>
    `);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: DB_PATH });
});

// Get events in a time range
app.get('/api/events', (req, res) => {
  try {
    const startTs = parseInt(req.query.start_ts as string);
    const endTs = parseInt(req.query.end_ts as string);

    if (isNaN(startTs) || isNaN(endTs)) {
      return res.status(400).json({ error: 'Invalid start_ts or end_ts' });
    }

    const events = getEventsInRange(startTs, endTs);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's timeline
app.get('/api/timeline/today', (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const events = getEventsInRange(startOfDay, endOfDay);
    const timeline: TimelineBlock[] = events.map(event => ({
      kind: event.kind,
      label: event.kind === 'web' ? (event.domain || 'Unknown') : (event.app_name || 'Unknown'),
      detail: event.kind === 'web' ? event.url : event.window_title,
      start_ts: event.start_ts,
      end_ts: event.end_ts,
      // Calculate duration from timestamps instead of using active_seconds
      active_seconds: Math.floor((event.end_ts - event.start_ts) / 1000),
      call_provider: event.call_provider
    }));

    res.json({ timeline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily stats
app.get('/api/stats/daily', (req, res) => {
  try {
    // Get date in local timezone (not UTC)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');
    const localDate = `${currentYear}-${currentMonth}-${currentDay}`;
    const date = req.query.date as string || localDate;

    // Parse date and create start/end of day in local timezone
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000; // Start of next day

    const events = getEventsInRange(startOfDay, endOfDay);
    const calls = getCallEvents(startOfDay, endOfDay);

    // Calculate total active time from timestamps instead of active_seconds to avoid rounding errors
    const total_active_seconds = events.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);

    // Calculate app switches (count ALL context switches between different activities)
    let app_switches = 0;
    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i - 1];
      const currEvent = events[i];

      // Count as a switch if switching between different contexts:
      // - Different apps
      // - Different websites
      // - Different calls
      // - Switching between app/web/call types
      let isDifferent = false;

      if (prevEvent.kind === 'app' && currEvent.kind === 'app') {
        isDifferent = prevEvent.app_name !== currEvent.app_name;
      } else if (prevEvent.kind === 'web' && currEvent.kind === 'web') {
        isDifferent = prevEvent.domain !== currEvent.domain;
      } else if (prevEvent.kind === 'call' && currEvent.kind === 'call') {
        isDifferent = prevEvent.call_provider !== currEvent.call_provider;
      } else {
        // Different kinds (app -> web, web -> call, etc.)
        isDifferent = true;
      }

      if (isDifferent) {
        app_switches++;
      }
    }

    // Top apps - calculate duration from timestamps
    const appMap = new Map<string, number>();
    events.filter(e => e.kind === 'app' && e.app_name).forEach(e => {
      const current = appMap.get(e.app_name!) || 0;
      const duration = Math.floor((e.end_ts - e.start_ts) / 1000);
      appMap.set(e.app_name!, current + duration);
    });
    const top_apps = Array.from(appMap.entries())
      .map(([app_name, active_seconds]) => ({ app_name, active_seconds }))
      .sort((a, b) => b.active_seconds - a.active_seconds)
      .slice(0, 10);

    // Top sites - calculate duration from timestamps
    const siteMap = new Map<string, number>();
    events.filter(e => e.kind === 'web' && e.domain).forEach(e => {
      const current = siteMap.get(e.domain!) || 0;
      const duration = Math.floor((e.end_ts - e.start_ts) / 1000);
      siteMap.set(e.domain!, current + duration);
    });
    const top_sites = Array.from(siteMap.entries())
      .map(([domain, active_seconds]) => ({ domain, active_seconds }))
      .sort((a, b) => b.active_seconds - a.active_seconds)
      .slice(0, 10);

    // Call sessions - calculate duration from timestamps
    const callSessions = calls.map(c => ({
      call_provider: c.call_provider!,
      start_ts: c.start_ts,
      end_ts: c.end_ts,
      duration_seconds: Math.floor((c.end_ts - c.start_ts) / 1000)
    }));

    const stats: DailyStats = {
      date,
      total_active_seconds,
      app_switches,
      top_apps,
      top_sites,
      calls: callSessions
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get available dates with data
app.get('/api/dates/available', (req, res) => {
  try {
    const dates = getAvailableDates();
    res.json({ dates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = getAllSettings();
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update setting
app.put('/api/settings/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Missing value' });
    }

    setSetting(key, value);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export data
app.get('/api/export', (req, res) => {
  try {
    const format = req.query.format as string || 'json';
    const startTs = parseInt(req.query.start_ts as string) || 0;
    const endTs = parseInt(req.query.end_ts as string) || Date.now();

    const events = getEventsInRange(startTs, endTs);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-export.json');
      res.json({ events, exported_at: Date.now() });
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-export.csv');
      
      const csv = eventsToCSV(events);
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Invalid format. Use json or csv' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to convert events to CSV
function eventsToCSV(events: ActivityEvent[]): string {
  const headers = ['id', 'kind', 'app_name', 'process_name', 'window_title', 'url', 'domain', 'call_provider', 'start_ts', 'end_ts', 'active_seconds', 'privacy_redacted'];
  const rows = events.map(e => [
    e.id,
    e.kind,
    e.app_name || '',
    e.process_name || '',
    e.window_title || '',
    e.url || '',
    e.domain || '',
    e.call_provider || '',
    e.start_ts,
    e.end_ts,
    e.active_seconds,
    e.privacy_redacted ? 'true' : 'false'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Obsidian integration endpoints

// Get Obsidian settings
app.get('/api/obsidian/settings', (req, res) => {
  try {
    const settings = getObsidianSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Obsidian settings
app.put('/api/obsidian/settings', (req, res) => {
  try {
    const { vault_path, auto_export, export_time } = req.body;

    if (vault_path !== undefined) {
      setSetting('obsidian_vault_path', vault_path);
    }
    if (auto_export !== undefined) {
      setSetting('obsidian_auto_export', auto_export.toString());
    }
    if (export_time !== undefined) {
      setSetting('obsidian_export_time', export_time);
    }

    // Restart scheduler with new settings
    startAutoExportScheduler();

    const updatedSettings = getObsidianSettings();
    res.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get markdown export for a specific date (preview without writing to file)
app.get('/api/export/obsidian', (req, res) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    // Parse date in local timezone to avoid UTC offset issues
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    const startOfDay = dateObj.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const events = getEventsInRange(startOfDay, endOfDay);
    const markdown = generateDailyMarkdown(date, events);

    res.setHeader('Content-Type', 'text/markdown');
    res.send(markdown);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger export to Obsidian vault
app.post('/api/obsidian/export', async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const result = await exportToObsidian(date);

    if (result.success) {
      res.json({
        success: true,
        message: 'Successfully exported to Obsidian',
        file_path: result.file_path
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Jira integration endpoints

// Get Jira issues
app.get('/api/jira/issues', async (req, res) => {
  try {
    const jiraUrl = getSetting('jira_url');
    const jiraEmail = getSetting('jira_email');
    const jiraToken = getSetting('jira_api_token');
    const jiraProject = getSetting('jira_project');

    if (!jiraUrl || !jiraEmail || !jiraToken || !jiraProject) {
      return res.json({
        issues: [],
        error: 'Jira not configured. Please set jira_url, jira_email, jira_api_token, and jira_project in settings.'
      });
    }

    // Fetch issues from Jira
    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
    const jiraResponse = await fetch(
      `${jiraUrl}/rest/api/3/search?jql=project=${jiraProject} ORDER BY updated DESC&maxResults=50`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!jiraResponse.ok) {
      throw new Error(`Jira API error: ${jiraResponse.statusText}`);
    }

    const data: any = await jiraResponse.json();

    const issues = data.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      priority: issue.fields.priority?.name || 'None',
      type: issue.fields.issuetype.name,
      updated: issue.fields.updated
    }));

    res.json({ issues });
  } catch (error: any) {
    res.status(500).json({ error: error.message, issues: [] });
  }
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[API] Server running on http://127.0.0.1:${PORT}`);
  console.log(`[API] Database: ${DB_PATH}`);

  // Start auto-export scheduler
  startAutoExportScheduler();
});

