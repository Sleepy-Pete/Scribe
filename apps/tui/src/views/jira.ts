import blessed from 'blessed';
import { ApiClient } from '../api-client';

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  priority: string;
  type: string;
  updated: string;
}

export class JiraView {
  private screen: blessed.Widgets.Screen;
  private container: blessed.Widgets.BoxElement;
  private apiClient: ApiClient;
  private list: blessed.Widgets.ListElement;

  constructor(screen: blessed.Widgets.Screen, container: blessed.Widgets.BoxElement, apiClient: ApiClient) {
    this.screen = screen;
    this.container = container;
    this.apiClient = apiClient;

    // Create list widget
    this.list = blessed.list({
      parent: container,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      keys: true,
      vi: true,
      mouse: true,
      padding: {
        left: 1,
        right: 1
      },
      scrollbar: {
        ch: '█',
        track: {
          bg: '#1a1a1a'
        },
        style: {
          bg: '#00ffff'
        }
      },
      style: {
        selected: {
          bg: '#00ffff',
          fg: '#1a1a1a',
          bold: true
        },
        item: {
          fg: '#e0e0e0'
        },
        bg: '#1a1a1a'
      },
      hidden: true
    });
  }

  async show() {
    const items: string[] = [];

    try {
      const issues = await this.apiClient.getJiraIssues();

      if (!issues || issues.length === 0) {
        items.push('No Jira issues found.');
        items.push('');
        items.push('Configure Jira settings in the Settings tab (Tab 3).');
        items.push('');
        items.push('Required settings:');
        items.push('  - jira_url: Your Jira instance URL');
        items.push('  - jira_email: Your Jira email');
        items.push('  - jira_api_token: Your Jira API token');
        items.push('  - jira_project: Project key (e.g., SCRUM)');
      } else {
        // Add summary at top
        const inProgress = issues.filter(i => i.status === 'In Progress').length;
        const toDo = issues.filter(i => i.status === 'To Do').length;
        const inReview = issues.filter(i => i.status === 'In Review').length;
        const done = issues.filter(i => i.status === 'Done').length;

        items.push(`Total Issues: ${issues.length} | In Progress: ${inProgress} | To Do: ${toDo} | In Review: ${inReview} | Done: ${done}`);
        items.push('─'.repeat(80));
        items.push('');

        // Group by status
        const statuses = ['In Progress', 'To Do', 'In Review', 'Done'];
        
        for (const status of statuses) {
          const statusIssues = issues.filter(i => i.status === status);
          if (statusIssues.length === 0) continue;

          items.push(`${this.getStatusIcon(status)} ${status.toUpperCase()} (${statusIssues.length})`);
          items.push('');

          for (const issue of statusIssues) {
            const typeIcon = this.getTypeIcon(issue.type);
            const priorityIcon = this.getPriorityIcon(issue.priority);
            
            items.push(`  ${typeIcon} ${issue.key} - ${issue.summary}`);
            items.push(`    ${priorityIcon} ${issue.priority} | Assignee: ${issue.assignee || 'Unassigned'}`);
            items.push('');
          }
        }
      }
    } catch (error: any) {
      items.push('❌ Error loading Jira issues');
      items.push('');
      items.push(`Error: ${error.message}`);
      items.push('');
      items.push('Make sure Jira is configured in Settings (Tab 3)');
    }

    this.list.setItems(items);
    this.list.show();
    this.list.focus();
    this.screen.render();
  }

  hide() {
    this.list.hide();
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'In Progress': '🔄',
      'To Do': '📋',
      'In Review': '👀',
      'Done': '✅'
    };
    return icons[status] || '📌';
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Task': '📝',
      'Bug': '🐛',
      'Epic': '🎯',
      'Story': '📖'
    };
    return icons[type] || '📄';
  }

  private getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      'Highest': '🔴',
      'High': '🟠',
      'Medium': '🟡',
      'Low': '🟢',
      'Lowest': '⚪'
    };
    return icons[priority] || '⚪';
  }
}

