import blessed from 'blessed';
import { TimelineView } from './views/timeline';
import { StatsView } from './views/stats';
import { SettingsView } from './views/settings';
import { ExportView } from './views/export';
import { ApiClient } from './api-client';
import { styles, padding, styledText } from './styles';

export class ScribeTUI {
  private screen: blessed.Widgets.Screen;
  private apiClient: ApiClient;
  private currentTab: 'timeline' | 'stats' | 'settings' | 'export' = 'timeline';
  private refreshInterval?: NodeJS.Timeout;

  // UI Components
  private header: blessed.Widgets.BoxElement;
  private tabBar: blessed.Widgets.BoxElement;
  private contentContainer: blessed.Widgets.BoxElement;
  private statusBar: blessed.Widgets.BoxElement;

  // Views
  private timelineView: TimelineView;
  private statsView: StatsView;
  private settingsView: SettingsView;
  private exportView: ExportView;

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
    this.settingsView = new SettingsView(this.screen, this.contentContainer, this.apiClient);
    this.exportView = new ExportView(this.screen, this.contentContainer, this.apiClient, (date) => {
      this.exportToObsidian(date);
    });

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
      content: styledText.center(styledText.bold('Scribe Activity Tracker')),
      tags: true,
      padding: padding.header,
      style: styles.header
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
      style: styles.tabBar
    });

    return tabBar;
  }

  private updateTabBar() {
    const tabs = [
      { key: 'timeline', label: 'Timeline [1]' },
      { key: 'stats', label: 'Statistics [2]' },
      { key: 'settings', label: 'Settings [3]' },
      { key: 'export', label: 'Export [4]' }
    ];

    const tabContent = tabs.map(tab => {
      const isActive = tab.key === this.currentTab;
      if (isActive) {
        return styledText.tabActive(tab.label);
      } else {
        return styledText.tabInactive(tab.label);
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
      padding: padding.content,
      style: styles.contentContainer
    });
  }

  private createStatusBar(): blessed.Widgets.BoxElement {
    return blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: ' q:quit | 1-4:tabs | r:refresh | e/Enter:export (in Export tab) | ↑↓/j/k:scroll',
      tags: true,
      style: styles.statusBar
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
    this.screen.key(['3'], () => this.switchTab('settings'));
    this.screen.key(['4'], () => this.switchTab('export'));

    // Refresh
    this.screen.key(['r'], () => this.refresh());

    // Export to Obsidian (only works when not in export tab, as export tab handles 'e' internally)
    this.screen.key(['e'], () => {
      if (this.currentTab !== 'export') {
        this.exportToObsidian();
      }
    });
  }

  private switchTab(tab: 'timeline' | 'stats' | 'settings' | 'export') {
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
      this.settingsView.hide();
      this.exportView.hide();

      // Show and render the current view
      switch (this.currentTab) {
        case 'timeline':
          await this.timelineView.show();
          break;
        case 'stats':
          await this.statsView.show();
          break;
        case 'settings':
          await this.settingsView.show();
          break;
        case 'export':
          await this.exportView.show();
          break;
      }
      this.statusBar.setContent('q:quit | 1-4:tabs | r:refresh | e/Enter:export (in Export tab) | ↑↓/j/k:scroll');
    } catch (error: any) {
      this.statusBar.setContent(`Error: ${error.message}`);
    }

    this.screen.render();
  }

  private async exportToObsidian(date?: string) {
    const dateStr = date ? ` for ${date}` : ' for today';
    this.statusBar.setContent(`Exporting${dateStr} to Obsidian...`);
    this.screen.render();

    try {
      const body = date ? JSON.stringify({ date }) : undefined;
      const headers = date ? { 'Content-Type': 'application/json' } : undefined;

      const response = await fetch('http://127.0.0.1:3737/api/obsidian/export', {
        method: 'POST',
        headers,
        body
      });

      if (response.ok) {
        const result: any = await response.json();
        this.statusBar.setContent(`✓ Exported${dateStr} to Obsidian: ${result.file_path || 'Success'}`);
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
      this.statusBar.setContent('q:quit | 1-4:tabs | r:refresh | e/Enter:export (in Export tab) | ↑↓/j/k:scroll');
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

