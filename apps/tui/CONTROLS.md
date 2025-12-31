# Scribe TUI Controls

## Keyboard Shortcuts

### Global Controls
- **q** - Quit the application
- **Ctrl+C** - Quit the application (alternative)
- **r** - Refresh current view (reload data from API)
- **e** - Export today's data to Obsidian vault

### Tab Navigation
- **1** - Switch to Timeline view
- **2** - Switch to Statistics view
- **3** - Switch to Jira view
- **4** - Switch to Settings view

### List Navigation
- **↑** / **k** - Scroll up one line
- **↓** / **j** - Scroll down one line
- **Page Up** - Scroll up one page
- **Page Down** - Scroll down one page
- **Home** / **g** - Jump to top of list
- **End** / **G** - Jump to bottom of list

### Mouse Controls
- **Scroll wheel** - Scroll through lists
- **Click** - Select items (where applicable)

## Views

### Timeline View (Tab 1)
Shows chronological list of all activities for today:
- Each activity shows: icon, app/site name, time range, duration
- Activities are sorted newest first
- Summary at top shows total active time and activity count

**Icons:**
- 📞 Call/meeting
- 🌐 Website/browser
- 💬 Communication (Discord, Slack, Messages)
- 📝 Note-taking (Obsidian)
- ⌨️ Development (VS Code, Terminal, Xcode)
- 💻 Other applications

### Statistics View (Tab 2)
Shows aggregated statistics for today:
- **Summary** - Total active time and context switches
- **Top Applications** - Most used apps with time and percentage
- **Top Websites** - Most visited sites with time and percentage
- **Call Sessions** - All calls/meetings with duration

Visual bars show relative usage for apps and websites.

### Jira View (Tab 3)
Shows your Jira issues grouped by status:
- **Summary** - Total issues and counts by status
- **Grouped by Status** - Issues organized by In Progress, To Do, In Review, Done
- **Issue Details** - Key, summary, priority, assignee for each issue

**Icons:**
- 🔄 In Progress
- 📋 To Do
- 👀 In Review
- ✅ Done
- 📝 Task
- 🐛 Bug
- 🎯 Epic
- 📖 Story
- 🔴 Highest priority
- 🟠 High priority
- 🟡 Medium priority
- 🟢 Low priority

**Configuration Required:**
To use Jira integration, configure these settings (Tab 4):
- `jira_url` - Your Jira instance URL (e.g., https://yourcompany.atlassian.net)
- `jira_email` - Your Jira email address
- `jira_api_token` - Your Jira API token (create at https://id.atlassian.com/manage-profile/security/api-tokens)
- `jira_project` - Project key (e.g., SCRUM)

### Settings View (Tab 4)
Shows configuration and system information:
- **System Information** - API status, database location
- **Tracker Settings** - Polling interval, idle timeout, privacy mode
- **Obsidian Integration** - Vault path, auto-export settings
- **Data Export** - Available export formats and API endpoints
- **All Settings** - Complete list of configuration values

## Obsidian Export

Press **e** from any view to export today's activities to your Obsidian vault.

**Requirements:**
1. Obsidian vault path must be configured (see Settings)
2. Vault directory must exist and be accessible

**Export Format:**
- Creates a markdown file in your vault
- Filename: `YYYY-MM-DD.md` (e.g., `2025-12-31.md`)
- Includes summary, top apps, top sites, and detailed timeline
- Automatically categorizes activities (meetings, coding, communication, browsing)

**Status Messages:**
- `Exporting to Obsidian...` - Export in progress
- `✓ Exported to Obsidian: <path>` - Success
- `✗ Export failed: <error>` - Failure (check vault path in settings)

## Tips

1. **Refresh regularly** - Press `r` to see latest activity and Jira updates
2. **Use vi keys** - `j`/`k` for navigation if you prefer vim-style
3. **Check settings** - Tab 4 shows all configuration and API endpoints
4. **Export daily** - Press `e` at end of day to save to Obsidian
5. **Scroll efficiently** - Use Page Up/Down for faster navigation
6. **Jira integration** - Configure Jira settings in Tab 4 to see your issues in Tab 3

## Troubleshooting

**No data showing:**
- Press `r` to refresh
- Check that the tracker is running
- Verify API is accessible at http://127.0.0.1:3737

**Export fails:**
- Go to Settings (Tab 4) and verify Obsidian vault path
- Ensure the vault directory exists
- Check file permissions

**Statistics not updating:**
- Press `r` to manually refresh
- Statistics are calculated from all events in the database
- Make sure tracker is actively recording events

**Jira issues not showing:**
- Go to Settings (Tab 4) and configure Jira settings
- Required: jira_url, jira_email, jira_api_token, jira_project
- Create API token at https://id.atlassian.com/manage-profile/security/api-tokens
- Press `r` to refresh after configuring

