import blessed from 'blessed';
import { ApiClient } from '../api-client';
import { DailyStats } from '@scribe/types';
import { styles, colors, styledText } from '../styles';

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
          fg: colors.borderLight
        },
        bg: colors.bgDark
      },
      label: ' Daily Summary ',
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 0
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
      height: '50%-3',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: colors.borderLight
        },
        bg: colors.bgDark
      },
      label: ' Top Applications ',
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: colors.bgDark
        },
        style: {
          bg: colors.borderLight
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
      height: '50%-3',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: colors.borderLight
        },
        bg: colors.bgDark
      },
      label: ' Top Websites ',
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: colors.bgDark
        },
        style: {
          bg: colors.borderLight
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
          fg: colors.borderLight
        },
        bg: colors.bgDark
      },
      label: ' Call Sessions ',
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: colors.bgDark
        },
        style: {
          bg: colors.borderLight
        }
      },
      tags: true,
      hidden: true
    });
  }

  async show() {
    try {
      const stats = await this.apiClient.getDailyStats();

    // Summary content
    const date = stats.date || 'N/A';
    const activeTime = this.formatDuration(stats.total_active_seconds || 0);
    const appSwitches = stats.app_switches || 0;

    let summaryContent = '';
    summaryContent += `{bold}{${colors.secondary}-fg}Date:{/${colors.secondary}-fg}{/bold} {${colors.lightGray}-fg}${date}{/${colors.lightGray}-fg}    `;
    summaryContent += `{bold}{${colors.success}-fg}Active Time:{/${colors.success}-fg}{/bold} {${colors.warning}-fg}${activeTime}{/${colors.warning}-fg}    `;
    summaryContent += `{bold}{${colors.info}-fg}App Switches:{/${colors.info}-fg}{/bold} {${colors.lightGray}-fg}${appSwitches}{/${colors.lightGray}-fg}`;
    this.summaryBox.setContent(summaryContent);

    // Top Apps content
    let appsContent = '';
    if (stats.top_apps.length === 0) {
      appsContent = `{${colors.darkGray}-fg}No apps recorded{/${colors.darkGray}-fg}`;
    } else {
      const maxAppSeconds = stats.top_apps[0].active_seconds;
      stats.top_apps.forEach((app, i) => {
        const duration = this.formatDuration(app.active_seconds);
        const percentage = maxAppSeconds > 0 ? ((app.active_seconds / maxAppSeconds) * 100).toFixed(0) : '0';
        const bar = this.createBar(app.active_seconds, maxAppSeconds, 15);

        // Truncate app name if too long
        let appName = app.app_name;
        if (appName.length > 20) {
          appName = appName.substring(0, 17) + '...';
        }

        appsContent += `{bold}{${colors.secondary}-fg}${(i + 1).toString().padStart(2)}.{/${colors.secondary}-fg}{/bold} `;
        appsContent += `{${colors.lightGray}-fg}${appName.padEnd(20)}{/${colors.lightGray}-fg}\n`;
        appsContent += `    {${colors.success}-fg}${bar}{/${colors.success}-fg} `;
        appsContent += `{${colors.warning}-fg}${duration}{/${colors.warning}-fg} `;
        appsContent += `{${colors.darkGray}-fg}(${percentage}%){/${colors.darkGray}-fg}\n\n`;
      });
    }
    this.appsBox.setContent(appsContent);

    // Top Sites content
    let sitesContent = '';
    if (stats.top_sites.length === 0) {
      sitesContent = `{${colors.darkGray}-fg}No websites recorded{/${colors.darkGray}-fg}`;
    } else {
      const maxSiteSeconds = stats.top_sites[0].active_seconds;
      stats.top_sites.forEach((site, i) => {
        const duration = this.formatDuration(site.active_seconds);
        const percentage = maxSiteSeconds > 0 ? ((site.active_seconds / maxSiteSeconds) * 100).toFixed(0) : '0';
        const bar = this.createBar(site.active_seconds, maxSiteSeconds, 15);

        // Truncate domain if too long
        let domain = site.domain;
        if (domain.length > 20) {
          domain = domain.substring(0, 17) + '...';
        }

        sitesContent += `{bold}{${colors.secondary}-fg}${(i + 1).toString().padStart(2)}.{/${colors.secondary}-fg}{/bold} `;
        sitesContent += `{${colors.info}-fg}${domain.padEnd(20)}{/${colors.info}-fg}\n`;
        sitesContent += `    {${colors.success}-fg}${bar}{/${colors.success}-fg} `;
        sitesContent += `{${colors.warning}-fg}${duration}{/${colors.warning}-fg} `;
        sitesContent += `{${colors.darkGray}-fg}(${percentage}%){/${colors.darkGray}-fg}\n\n`;
      });
    }
    this.sitesBox.setContent(sitesContent);

    // Calls content
    let callsContent = '';
    if (stats.calls.length === 0) {
      callsContent = `{${colors.darkGray}-fg}No calls detected today{/${colors.darkGray}-fg}`;
    } else {
      stats.calls.forEach(call => {
        const startTime = new Date(call.start_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = new Date(call.end_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const duration = this.formatDuration(call.duration_seconds);
        const provider = this.getCallProviderName(call.call_provider);

        callsContent += `{bold}📞{/bold} {${colors.success}-fg}${provider.padEnd(20)}{/${colors.success}-fg} `;
        callsContent += `{${colors.darkGray}-fg}${startTime} - ${endTime}{/${colors.darkGray}-fg} `;
        callsContent += `{${colors.warning}-fg}(${duration}){/${colors.warning}-fg}\n`;
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
    } catch (error: any) {
      // Display error message
      this.summaryBox.setContent(styledText.error(`Error loading stats: ${error.message}`));
      this.appsBox.setContent(styledText.secondary('Unable to load data'));
      this.sitesBox.setContent(styledText.secondary('Unable to load data'));
      this.callsBox.setContent(styledText.secondary('Unable to load data'));

      this.summaryBox.show();
      this.appsBox.show();
      this.sitesBox.show();
      this.callsBox.show();

      this.screen.render();
    }
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
    if (maxValue === 0) {
      return '░'.repeat(width);
    }
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

