import blessed from 'blessed';
import { ApiClient } from '../api-client';
import { DailyStats } from '@scribe/types';

export class StatsView {
  private screen: blessed.Widgets.Screen;
  private container: blessed.Widgets.BoxElement;
  private apiClient: ApiClient;
  private summaryBox: blessed.Widgets.BoxElement;
  private appsBox: blessed.Widgets.BoxElement;
  private sitesBox: blessed.Widgets.BoxElement;
  private callsBox: blessed.Widgets.BoxElement;

  constructor(screen: blessed.Widgets.Screen, container: blessed.Widgets.BoxElement, apiClient: ApiClient) {
    this.screen = screen;
    this.container = container;
    this.apiClient = apiClient;

    // Create summary box at top
    this.summaryBox = blessed.box({
      parent: container,
      top: 0,
      left: 0,
      width: '100%',
      height: 5,
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: '#00ffff'
        },
        bg: '#1a1a1a'
      },
      label: ' Daily Summary ',
      padding: {
        left: 1,
        right: 1
      },
      tags: true,
      hidden: true
    });

    // Create apps box (left column)
    this.appsBox = blessed.box({
      parent: container,
      top: 5,
      left: 0,
      width: '50%',
      height: '50%-5',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: '#00ffff'
        },
        bg: '#1a1a1a'
      },
      label: ' Top Applications ',
      padding: {
        left: 1,
        right: 1
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: '#1a1a1a'
        },
        style: {
          bg: '#00ffff'
        }
      },
      tags: true,
      hidden: true
    });

    // Create sites box (right column)
    this.sitesBox = blessed.box({
      parent: container,
      top: 5,
      left: '50%',
      width: '50%',
      height: '50%-5',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: '#00ffff'
        },
        bg: '#1a1a1a'
      },
      label: ' Top Websites ',
      padding: {
        left: 1,
        right: 1
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: '#1a1a1a'
        },
        style: {
          bg: '#00ffff'
        }
      },
      tags: true,
      hidden: true
    });

    // Create calls box (bottom)
    this.callsBox = blessed.box({
      parent: container,
      top: '50%',
      left: 0,
      width: '100%',
      height: '50%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: '#00ffff'
        },
        bg: '#1a1a1a'
      },
      label: ' Call Sessions ',
      padding: {
        left: 1,
        right: 1
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: '#1a1a1a'
        },
        style: {
          bg: '#00ffff'
        }
      },
      tags: true,
      hidden: true
    });
  }

  async show() {
    const stats = await this.apiClient.getDailyStats();

    // Summary content
    const date = stats.date || 'N/A';
    const activeTime = this.formatDuration(stats.total_active_seconds || 0);
    const appSwitches = stats.app_switches || 0;

    let summaryContent = '';
    summaryContent += `{bold}{cyan-fg}Date:{/cyan-fg}{/bold} {white-fg}${date}{/white-fg}    `;
    summaryContent += `{bold}{green-fg}Active Time:{/green-fg}{/bold} {white-fg}${activeTime}{/white-fg}    `;
    summaryContent += `{bold}{yellow-fg}App Switches:{/yellow-fg}{/bold} {white-fg}${appSwitches}{/white-fg}`;
    this.summaryBox.setContent(summaryContent);

    // Top Apps content
    let appsContent = '';
    if (stats.top_apps.length === 0) {
      appsContent = '{gray-fg}No apps recorded{/gray-fg}';
    } else {
      stats.top_apps.forEach((app, i) => {
        const duration = this.formatDuration(app.active_seconds);
        const percentage = ((app.active_seconds / stats.total_active_seconds) * 100).toFixed(1);
        const bar = this.createBar(app.active_seconds, stats.top_apps[0].active_seconds, 15);

        // Truncate app name if too long
        let appName = app.app_name;
        if (appName.length > 20) {
          appName = appName.substring(0, 17) + '...';
        }

        appsContent += `{bold}{cyan-fg}${(i + 1).toString().padStart(2)}.{/cyan-fg}{/bold} `;
        appsContent += `{white-fg}${appName.padEnd(20)}{/white-fg}\n`;
        appsContent += `    {green-fg}${bar}{/green-fg} `;
        appsContent += `{yellow-fg}${duration}{/yellow-fg} `;
        appsContent += `{gray-fg}(${percentage}%){/gray-fg}\n\n`;
      });
    }
    this.appsBox.setContent(appsContent);

    // Top Sites content
    let sitesContent = '';
    if (stats.top_sites.length === 0) {
      sitesContent = '{gray-fg}No websites recorded{/gray-fg}';
    } else {
      stats.top_sites.forEach((site, i) => {
        const duration = this.formatDuration(site.active_seconds);
        const percentage = ((site.active_seconds / stats.total_active_seconds) * 100).toFixed(1);
        const bar = this.createBar(site.active_seconds, stats.top_sites[0].active_seconds, 15);

        // Truncate domain if too long
        let domain = site.domain;
        if (domain.length > 20) {
          domain = domain.substring(0, 17) + '...';
        }

        sitesContent += `{bold}{cyan-fg}${(i + 1).toString().padStart(2)}.{/cyan-fg}{/bold} `;
        sitesContent += `{blue-fg}${domain.padEnd(20)}{/blue-fg}\n`;
        sitesContent += `    {green-fg}${bar}{/green-fg} `;
        sitesContent += `{yellow-fg}${duration}{/yellow-fg} `;
        sitesContent += `{gray-fg}(${percentage}%){/gray-fg}\n\n`;
      });
    }
    this.sitesBox.setContent(sitesContent);

    // Calls content
    let callsContent = '';
    if (stats.calls.length === 0) {
      callsContent = '{gray-fg}No calls detected today{/gray-fg}';
    } else {
      stats.calls.forEach(call => {
        const startTime = new Date(call.start_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(call.end_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const duration = this.formatDuration(call.duration_seconds);
        const provider = this.getCallProviderName(call.call_provider);

        callsContent += `{bold}📞{/bold} {green-fg}${provider.padEnd(20)}{/green-fg} `;
        callsContent += `{gray-fg}${startTime} - ${endTime}{/gray-fg} `;
        callsContent += `{yellow-fg}(${duration}){/yellow-fg}\n`;
      });
    }
    this.callsBox.setContent(callsContent);

    // Show all boxes
    this.summaryBox.show();
    this.appsBox.show();
    this.sitesBox.show();
    this.callsBox.show();

    this.appsBox.focus();
    this.screen.render();
  }

  hide() {
    this.summaryBox.hide();
    this.appsBox.hide();
    this.sitesBox.hide();
    this.callsBox.hide();
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  private createBar(value: number, maxValue: number, width: number): string {
    const filled = Math.round((value / maxValue) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private getCallProviderName(provider: string): string {
    const names: Record<string, string> = {
      'meet': 'Google Meet',
      'discord': 'Discord',
      'zoom': 'Zoom',
      'slack': 'Slack',
      'teams': 'Microsoft Teams',
      'facetime': 'FaceTime',
      'other': 'Call'
    };
    return names[provider] || provider;
  }
}

