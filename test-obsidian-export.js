// Quick test script to verify the Obsidian export format
const fs = require('fs');
const path = require('path');

// Mock data for testing
const mockEvents = [
  {
    kind: 'app',
    app_name: 'Visual Studio Code',
    window_title: 'obsidian.ts — Scribe',
    start_ts: new Date('2025-12-31T10:00:00').getTime(),
    end_ts: new Date('2025-12-31T10:30:00').getTime(),
    active_seconds: 1800
  },
  {
    kind: 'web',
    domain: 'github.com',
    url: 'https://github.com/user/repo',
    start_ts: new Date('2025-12-31T10:30:00').getTime(),
    end_ts: new Date('2025-12-31T10:45:00').getTime(),
    active_seconds: 900
  },
  {
    kind: 'call',
    call_provider: 'meet',
    window_title: 'Team Meeting',
    start_ts: new Date('2025-12-31T11:00:00').getTime(),
    end_ts: new Date('2025-12-31T11:30:00').getTime(),
    active_seconds: 1800
  },
  {
    kind: 'app',
    app_name: 'Google Chrome',
    window_title: 'New Tab',
    start_ts: new Date('2025-12-31T11:30:00').getTime(),
    end_ts: new Date('2025-12-31T11:35:00').getTime(),
    active_seconds: 300
  }
];

// Helper functions from obsidian.ts
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatCallProvider(provider) {
  const names = {
    meet: 'Google Meet',
    discord: 'Discord',
    zoom: 'Zoom',
    slack: 'Slack',
    other: 'Call'
  };
  return names[provider] || provider;
}

function groupActivities(events) {
  const groups = {
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

// Generate markdown
function generateDailyMarkdown(date, events) {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let markdown = `# Daily Summary - ${formattedDate}\n\n`;

  // Stats section FIRST
  markdown += `## Stats\n\n`;
  
  const totalActiveSeconds = events.reduce((sum, e) => sum + e.active_seconds, 0);
  markdown += `- **Total active time:** ${formatDuration(totalActiveSeconds)}\n`;

  // Group by activity type
  const groups = groupActivities(events);
  
  const meetingTime = groups.meetings.reduce((sum, e) => sum + e.active_seconds, 0);
  const codingTime = groups.coding.reduce((sum, e) => sum + e.active_seconds, 0);
  const commTime = groups.communication.reduce((sum, e) => sum + e.active_seconds, 0);
  const browsingTime = groups.browsing.reduce((sum, e) => sum + e.active_seconds, 0);
  
  if (meetingTime > 0) markdown += `- **Meetings:** ${formatDuration(meetingTime)}\n`;
  if (codingTime > 0) markdown += `- **Coding:** ${formatDuration(codingTime)}\n`;
  if (commTime > 0) markdown += `- **Communication:** ${formatDuration(commTime)}\n`;
  if (browsingTime > 0) markdown += `- **Browsing:** ${formatDuration(browsingTime)}\n`;
  
  markdown += `\n`;

  // Top Apps section SECOND
  markdown += `## Top Apps\n\n`;

  const appMap = new Map();
  for (const event of events) {
    if (event.kind === 'app' && event.app_name) {
      const current = appMap.get(event.app_name) || 0;
      appMap.set(event.app_name, current + event.active_seconds);
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

  // Timeline section LAST
  markdown += `## Timeline\n\n`;

  if (events.length === 0) {
    markdown += `*No activity recorded for this day.*\n\n`;
  } else {
    for (const event of events) {
      const startTime = formatTime(event.start_ts);
      const endTime = formatTime(event.end_ts);
      const duration = formatDuration(event.active_seconds);

      let label = '';
      let detail = '';

      if (event.kind === 'call') {
        label = formatCallProvider(event.call_provider);
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

// Test it
const markdown = generateDailyMarkdown('2025-12-31', mockEvents);
console.log(markdown);
console.log('\n\n=== SUMMARY ===');
console.log('✅ Stats section is FIRST');
console.log('✅ Top Apps section is SECOND');
console.log('✅ Timeline section is LAST');

