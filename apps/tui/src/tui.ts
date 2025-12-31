import blessed from 'blessed';
import { TimelineView } from './views/timeline';
import { StatsView } from './views/stats';
import { SettingsView } from './views/settings';
import { JiraView } from './views/jira';
import { ApiClient } from './api-client';

export class ScribeTUI {
  private screen: blessed.Widgets.Screen;
  private apiClient: ApiClient;
  private currentTab: 'timeline' | 'stats' | 'jira' | 'settings' = 'timeline';
  private refreshInterval?: NodeJS.Timeout;

  // UI Components
  private header: blessed.Widgets.BoxElement;
  private tabBar: blessed.Widgets.BoxElement;
  private contentContainer: blessed.Widgets.BoxElement;
  private statusBar: blessed.Widgets.BoxElement;

  // Views
  private timelineView: TimelineView;
  private statsView: StatsView;
  private jiraView: JiraView;
  private settingsView: SettingsView;

  constructor() {
    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Scribe Activity Tracker',
      fullUnicode: true
    });

    this.apiClient = new ApiClient('http://127.0.0.1:3737');

    // Create UI components
    this.header = this.createHeader();
    this.tabBar = this.createTabBar();
    this.contentContainer = this.createContentContainer();
    this.statusBar = this.createStatusBar();

    // Create views
    this.timelineView = new TimelineView(this.screen, this.contentContainer, this.apiClient);
    this.statsView = new StatsView(this.screen, this.contentContainer, this.apiClient);
    this.jiraView = new JiraView(this.screen, this.contentContainer, this.apiClient);
    this.settingsView = new SettingsView(this.screen, this.contentContainer, this.apiClient);

    // Setup key bindings
    this.setupKeyBindings();

    // Update tab bar after all components are initialized
    this.updateTabBar();
  }

  private createHeader(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '{center}{bold}Scribe Activity Tracker{/bold}{/center}',
      tags: true,
      padding: {
        top: 1
      },
      style: {
        fg: 'white',
        bg: '#1a1a1a',
        bold: true
      }
    });
  }

  private createTabBar(): blessed.Widgets.BoxElement {
    const tabBar = blessed.box({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '100%',
      height: 2,
      tags: true,
      padding: {
        left: 2,
        top: 0
      },
      style: {
        fg: 'white',
        bg: '#0a0a0a'
      }
    });

    return tabBar;
  }

  private updateTabBar() {
    const tabs = [
      { key: 'timeline', label: 'Timeline [1]' },
      { key: 'stats', label: 'Statistics [2]' },
      { key: 'jira', label: 'Jira [3]' },
      { key: 'settings', label: 'Settings [4]' }
    ];

    const tabContent = tabs.map(tab => {
      const isActive = tab.key === this.currentTab;
      if (isActive) {
        return `{#00ffff-fg}{bold} ${tab.label} {/bold}{/#00ffff-fg}`;
      } else {
        return `{#666666-fg} ${tab.label} {/#666666-fg}`;
      }
    }).join('   ');

    this.tabBar.setContent(tabContent);
  }

  private createContentContainer(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      top: 5,
      left: 0,
      width: '100%',
      height: '100%-6',
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
      },
      style: {
        fg: '#e0e0e0',
        bg: '#1a1a1a'
      }
    });
  }

  private createStatusBar(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: ' q:quit | 1-4:tabs | r:refresh | e:export to Obsidian | ↑↓/j/k:scroll',
      tags: true,
      style: {
        fg: '#1a1a1a',
        bg: '#00ffff',
        bold: true
      }
    });
  }

  private setupKeyBindings() {
    // Quit
    this.screen.key(['q', 'C-c'], () => {
      this.destroy();
      process.exit(0);
    });

    // Tab switching
    this.screen.key(['1'], () => this.switchTab('timeline'));
    this.screen.key(['2'], () => this.switchTab('stats'));
    this.screen.key(['3'], () => this.switchTab('jira'));
    this.screen.key(['4'], () => this.switchTab('settings'));

    // Refresh
    this.screen.key(['r'], () => this.refresh());

    // Export to Obsidian
    this.screen.key(['e'], () => this.exportToObsidian());
  }

  private switchTab(tab: 'timeline' | 'stats' | 'jira' | 'settings') {
    this.currentTab = tab;
    this.updateTabBar();
    this.refresh();
  }

  private async refresh() {
    this.statusBar.setContent('{center}Loading...{/center}');
    this.screen.render();

    try {
      // Hide all views first
      this.timelineView.hide();
      this.statsView.hide();
      this.jiraView.hide();
      this.settingsView.hide();

      // Show and render the current view
      switch (this.currentTab) {
        case 'timeline':
          await this.timelineView.show();
          break;
        case 'stats':
          await this.statsView.show();
          break;
        case 'jira':
          await this.jiraView.show();
          break;
        case 'settings':
          await this.settingsView.show();
          break;
      }
      this.statusBar.setContent('q:quit | 1-4:tabs | r:refresh | e:export to Obsidian | ↑↓/j/k:scroll');
    } catch (error: any) {
      this.statusBar.setContent(`Error: ${error.message}`);
    }

    this.screen.render();
  }

  private async exportToObsidian() {
    this.statusBar.setContent('Exporting to Obsidian...');
    this.screen.render();

    try {
      const response = await fetch('http://127.0.0.1:3737/api/obsidian/export', {
        method: 'POST'
      });

      if (response.ok) {
        const result: any = await response.json();
        this.statusBar.setContent(`✓ Exported to Obsidian: ${result.file_path || 'Success'}`);
      } else {
        const error = await response.text();
        this.statusBar.setContent(`✗ Export failed: ${error}`);
      }
    } catch (error: any) {
      this.statusBar.setContent(`✗ Export error: ${error.message}`);
    }

    this.screen.render();

    // Reset status bar after 3 seconds
    setTimeout(() => {
      this.statusBar.setContent('q:quit | 1-4:tabs | r:refresh | e:export to Obsidian | ↑↓/j/k:scroll');
      this.screen.render();
    }, 3000);
  }

  public async start() {
    // Clear any previous output
    this.screen.clearRegion(0, this.screen.width as number, 0, this.screen.height as number);

    // Initial render
    await this.refresh();

    // Auto-refresh every 5 seconds
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 5000);

    // Render the screen
    this.screen.render();
  }

  public destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.screen.destroy();
  }
}

