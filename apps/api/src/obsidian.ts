import * as fs from 'fs';
import * as path from 'path';
import { getEventsInRange, getSetting } from '@scribe/database';
import { ActivityEvent, CallProvider, ObsidianExportResult } from '@scribe/types';

/**
 * Format seconds into human-readable duration
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format timestamp to HH:MM
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format call provider name
 */
function formatCallProvider(provider: CallProvider): string {
  const names: Record<CallProvider, string> = {
    meet: 'Google Meet',
    discord: 'Discord',
    zoom: 'Zoom',
    slack: 'Slack',
    other: 'Call'
  };
  return names[provider] || provider;
}

/**
 * Group events into activity categories
 */
interface GroupedActivities {
  meetings: ActivityEvent[];
  coding: ActivityEvent[];
  communication: ActivityEvent[];
  browsing: ActivityEvent[];
  other: ActivityEvent[];
}

function groupActivities(events: ActivityEvent[]): GroupedActivities {
  const groups: GroupedActivities = {
    meetings: [],
    coding: [],
    communication: [],
    browsing: [],
    other: []
  };

  for (const event of events) {
    if (event.kind === 'call') {
      groups.meetings.push(event);
    } else if (event.kind === 'app') {
      const appName = event.app_name?.toLowerCase() || '';
      if (appName.includes('code') || appName.includes('xcode') || appName.includes('terminal')) {
        groups.coding.push(event);
      } else if (appName.includes('slack') || appName.includes('discord') || appName.includes('messages')) {
        groups.communication.push(event);
      } else {
        groups.other.push(event);
      }
    } else if (event.kind === 'web') {
      groups.browsing.push(event);
    }
  }

  return groups;
}

/**
 * Generate markdown content for a day's activities
 */
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

  let markdown = `# Daily Summary - ${formattedDate}\n\n`;

  // Stats section FIRST
  markdown += `## Stats\n\n`;

  // Calculate duration from timestamps instead of active_seconds to avoid rounding errors
  const totalActiveSeconds = events.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  markdown += `- **Total active time:** ${formatDuration(totalActiveSeconds)}\n`;

  // Group by activity type
  const groups = groupActivities(events);

  // Calculate durations from timestamps
  const meetingTime = groups.meetings.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  const codingTime = groups.coding.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  const commTime = groups.communication.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  const browsingTime = groups.browsing.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  
  if (meetingTime > 0) markdown += `- **Meetings:** ${formatDuration(meetingTime)}\n`;
  if (codingTime > 0) markdown += `- **Coding:** ${formatDuration(codingTime)}\n`;
  if (commTime > 0) markdown += `- **Communication:** ${formatDuration(commTime)}\n`;
  if (browsingTime > 0) markdown += `- **Browsing:** ${formatDuration(browsingTime)}\n`;
  
  markdown += `\n`;

  // Top Apps section SECOND
  markdown += `## Top Apps\n\n`;

  const appMap = new Map<string, number>();
  for (const event of events) {
    if (event.kind === 'app' && event.app_name) {
      const current = appMap.get(event.app_name) || 0;
      const duration = Math.floor((event.end_ts - event.start_ts) / 1000);
      appMap.set(event.app_name, current + duration);
    }
  }

  const topApps = Array.from(appMap.entries())
    .map(([app_name, active_seconds]) => ({ app_name, active_seconds }))
    .sort((a, b) => b.active_seconds - a.active_seconds)
    .slice(0, 10);

  if (topApps.length === 0) {
    markdown += `*No apps recorded.*\n\n`;
  } else {
    topApps.forEach((app, index) => {
      markdown += `${index + 1}. **${app.app_name}** - ${formatDuration(app.active_seconds)}\n`;
    });
    markdown += `\n`;
  }

  // Timeline section LAST (chronological order - oldest to newest for reading like a story)
  // Note: Dashboard shows reversed order (newest first) for quick reference
  markdown += `## Timeline\n\n`;

  if (events.length === 0) {
    markdown += `*No activity recorded for this day.*\n\n`;
  } else {
    // Events are already in chronological order from database query
    for (const event of events) {
      const startTime = formatTime(event.start_ts);
      const endTime = formatTime(event.end_ts);
      // Calculate duration from timestamps instead of using active_seconds
      const durationSeconds = Math.floor((event.end_ts - event.start_ts) / 1000);
      const duration = formatDuration(durationSeconds);

      let label = '';
      let detail = '';

      if (event.kind === 'call') {
        label = formatCallProvider(event.call_provider!);
        detail = event.window_title || '';
      } else if (event.kind === 'app') {
        label = event.app_name || 'Unknown App';
        detail = event.window_title || '';
      } else if (event.kind === 'web') {
        label = event.domain || 'Unknown Site';
        detail = event.url || '';
      }

      markdown += `- **${startTime}-${endTime}** (${duration}) - ${label}`;
      if (detail && detail !== label) {
        markdown += `\n  - ${detail}`;
      }
      markdown += `\n`;
    }
    markdown += `\n`;
  }

  return markdown;
}

/**
 * Check if a personal note exists for the given date
 */
function findPersonalNote(vaultPath: string, date: string): string | null {
  const [year, month, day] = date.split('-').map(Number);
  const yearStr = year.toString();
  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const dateStr = `${yearStr}${monthStr}${dayStr}`;

  // Common patterns for personal notes
  const patterns = [
    `${dateStr} - First Day.md`,
    `${dateStr} - *.md`,
    `${dateStr}.md`,
    `${year}-${monthStr}-${dayStr}.md`,
    `${year}-${monthStr}-${dayStr} - *.md`
  ];

  // Search for files matching patterns
  try {
    const files = fs.readdirSync(vaultPath);
    for (const file of files) {
      if (file.startsWith(dateStr) && file.endsWith('.md') && !file.includes('Export') && !file.includes('Merged')) {
        const filePath = path.join(vaultPath, file);
        return filePath;
      }
    }
  } catch (error) {
    // Directory read failed, continue without personal note
  }

  return null;
}

/**
 * Generate merged markdown combining personal notes and tracker data
 */
function generateMergedMarkdown(date: string, events: ActivityEvent[], personalNoteContent?: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let markdown = `# ${formattedDate}\n\n`;

  // If personal note exists, include it first
  if (personalNoteContent) {
    markdown += `## Personal Notes\n\n`;
    markdown += personalNoteContent.trim() + '\n\n';
    markdown += `---\n\n`;
  }

  // Add tracker data
  markdown += `## Activity Summary (Tracked Data)\n\n`;

  // Stats
  markdown += `### Stats\n\n`;
  const totalActiveSeconds = events.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  markdown += `- **Total active time:** ${formatDuration(totalActiveSeconds)}\n`;

  const groups = groupActivities(events);
  const meetingTime = groups.meetings.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  const codingTime = groups.coding.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  const commTime = groups.communication.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);
  const browsingTime = groups.browsing.reduce((sum, e) => sum + Math.floor((e.end_ts - e.start_ts) / 1000), 0);

  if (meetingTime > 0) markdown += `- **Meetings:** ${formatDuration(meetingTime)}\n`;
  if (codingTime > 0) markdown += `- **Coding:** ${formatDuration(codingTime)}\n`;
  if (commTime > 0) markdown += `- **Communication:** ${formatDuration(commTime)}\n`;
  if (browsingTime > 0) markdown += `- **Browsing:** ${formatDuration(browsingTime)}\n`;
  markdown += `\n`;

  // Top Apps
  markdown += `### Top Apps\n\n`;
  const appMap = new Map<string, number>();
  for (const event of events) {
    if (event.kind === 'app' && event.app_name) {
      const current = appMap.get(event.app_name) || 0;
      const duration = Math.floor((event.end_ts - event.start_ts) / 1000);
      appMap.set(event.app_name, current + duration);
    }
  }

  const topApps = Array.from(appMap.entries())
    .map(([app_name, active_seconds]) => ({ app_name, active_seconds }))
    .sort((a, b) => b.active_seconds - a.active_seconds)
    .slice(0, 10);

  if (topApps.length === 0) {
    markdown += `*No apps recorded.*\n\n`;
  } else {
    topApps.forEach((app, index) => {
      markdown += `${index + 1}. **${app.app_name}** - ${formatDuration(app.active_seconds)}\n`;
    });
    markdown += `\n`;
  }

  return markdown;
}

/**
 * Export daily activities to Obsidian vault
 * - Creates a "Scribe Tracker" subfolder for exports
 * - Checks for existing personal notes and merges them
 * - Generates summary even if no personal note exists
 */
export async function exportToObsidian(date: string): Promise<ObsidianExportResult> {
  try {
    // Get Obsidian settings
    const vaultPath = getSetting('obsidian_vault_path');

    if (!vaultPath) {
      return {
        success: false,
        error: 'Obsidian vault path not configured'
      };
    }

    // Verify vault path exists
    if (!fs.existsSync(vaultPath)) {
      return {
        success: false,
        error: `Vault path does not exist: ${vaultPath}`
      };
    }

    // Create Scribe Tracker subfolder if it doesn't exist
    const trackerFolder = path.join(vaultPath, 'Scribe Tracker');
    if (!fs.existsSync(trackerFolder)) {
      fs.mkdirSync(trackerFolder, { recursive: true });
    }

    // Parse date in local timezone to avoid UTC offset issues
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const startOfDay = dateObj.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const events = getEventsInRange(startOfDay, endOfDay);

    // Check for existing personal note
    const personalNotePath = findPersonalNote(vaultPath, date);
    let personalNoteContent: string | undefined;

    if (personalNotePath && fs.existsSync(personalNotePath)) {
      personalNoteContent = fs.readFileSync(personalNotePath, 'utf-8');
    }

    // Generate merged markdown
    const markdown = generateMergedMarkdown(date, events, personalNoteContent);

    // Format filename as YYYYMMDD - Export.md
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const filename = `${yearStr}${monthStr}${dayStr} - Export.md`;
    const filePath = path.join(trackerFolder, filename);

    // Write to file
    fs.writeFileSync(filePath, markdown, 'utf-8');

    return {
      success: true,
      file_path: filePath
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get Obsidian settings
 */
export function getObsidianSettings() {
  return {
    vault_path: getSetting('obsidian_vault_path') || '',
    auto_export: getSetting('obsidian_auto_export') === 'true',
    export_time: getSetting('obsidian_export_time') || '18:00'
  };
}

/**
 * Schedule automatic end-of-day exports
 */
let exportScheduler: NodeJS.Timeout | null = null;

export function startAutoExportScheduler() {
  // Clear existing scheduler if any
  if (exportScheduler) {
    clearInterval(exportScheduler);
  }

  const settings = getObsidianSettings();

  if (!settings.auto_export) {
    console.log('[Obsidian] Auto-export is disabled');
    return;
  }

  console.log(`[Obsidian] Auto-export enabled, scheduled for ${settings.export_time}`);

  // Check every minute if it's time to export
  exportScheduler = setInterval(async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (currentTime === settings.export_time) {
      console.log('[Obsidian] Running scheduled export...');

      // Export today's data
      const today = now.toISOString().split('T')[0];
      const result = await exportToObsidian(today);

      if (result.success) {
        console.log(`[Obsidian] Auto-export successful: ${result.file_path}`);
      } else {
        console.error(`[Obsidian] Auto-export failed: ${result.error}`);
      }
    }
  }, 60000); // Check every minute
}

export function stopAutoExportScheduler() {
  if (exportScheduler) {
    clearInterval(exportScheduler);
    exportScheduler = null;
    console.log('[Obsidian] Auto-export scheduler stopped');
  }
}

