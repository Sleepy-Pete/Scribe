import blessed from 'blessed';
import { ApiClient } from '../api-client';
import { TimelineBlock } from '@scribe/types';
import { styles, colors, styledText } from '../styles';

export class TimelineView {
  private screen: blessed.Widgets.Screen;
  private container: blessed.Widgets.BoxElement;
  private apiClient: ApiClient;
  private listBox: blessed.Widgets.BoxElement;
  private list: blessed.Widgets.ListElement;
  private detailBox: blessed.Widgets.BoxElement;
  private selectedBlock: TimelineBlock | null = null;

  constructor(screen: blessed.Widgets.Screen, container: blessed.Widgets.BoxElement, apiClient: ApiClient) {
    this.screen = screen;
    this.container = container;
    this.apiClient = apiClient;

    // Create left panel (list of activities)
    this.listBox = blessed.box({
      parent: container,
      top: 0,
      left: 0,
      width: '60%',
      height: '100%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: colors.borderLight
        },
        bg: colors.bgDark
      },
      label: ' Activities ',
      hidden: true
    });

    // Create list widget inside the box
    this.list = blessed.list({
      parent: this.listBox,
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
      },
      scrollbar: {
        ch: '█',
        track: {
          bg: colors.bgDark
        },
        style: {
          bg: colors.borderLight
        }
      },
      style: {
        selected: styles.list.selected,
        item: styles.list.item,
        bg: colors.bgDark
      }
    });

    // Create right panel (details)
    this.detailBox = blessed.box({
      parent: container,
      top: 0,
      left: '60%',
      width: '40%',
      height: '100%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: colors.borderLight
        },
        bg: colors.bgDark
      },
      label: ' Details ',
      padding: {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: colors.bgDark
        },
        style: {
          bg: colors.borderLight
        }
      },
      hidden: true,
      tags: true
    });

    // Handle selection changes
    this.list.on('select', (item, index) => {
      this.updateDetailPanel(index);
    });
  }

  private timelineData: TimelineBlock[] = [];

  async show() {
    const timeline = await this.apiClient.getTimeline();
    this.timelineData = [...timeline].sort((a, b) => b.start_ts - a.start_ts);

    const items: string[] = [];

    if (timeline.length === 0) {
      items.push('No activity recorded yet today.');
      items.push('');
      items.push('Start using your computer and the tracker will record your activity.');
    } else {
      // Add summary at top
      const totalSeconds = timeline.reduce((sum, b) => sum + b.active_seconds, 0);
      items.push(styledText.boldAccent(`Total: ${this.formatDuration(totalSeconds)} | Activities: ${timeline.length}`));
      items.push('');

      for (let i = 0; i < this.timelineData.length; i++) {
        const block = this.timelineData[i];
        const startTime = new Date(block.start_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = new Date(block.end_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const duration = this.formatDuration(block.active_seconds);

        // Determine icon and color based on kind
        // Using ASCII symbols to avoid emoji width issues in terminal
        let icon = '[A]';  // App
        let color = '#ffffff';
        const labelLower = block.label.toLowerCase();

        if (block.kind === 'call') {
          icon = '[C]';  // Call
          color = '#00ff00';  // Bright green for calls
        } else if (block.kind === 'web') {
          icon = '[W]';  // Web
          color = '#5b9bd5';  // Blue for web
        } else if (block.kind === 'app') {
          // Categorize apps by name
          if (labelLower.includes('discord')) {
            icon = '[D]';  // Discord
            color = '#ff69b4';  // Pink for chat
          } else if (labelLower.includes('obsidian')) {
            icon = '[N]';  // Notes
            color = '#ffd700';  // Gold for notes
          } else if (labelLower.includes('chrome') || labelLower.includes('safari') || labelLower.includes('firefox')) {
            icon = '[B]';  // Browser
            color = '#5b9bd5';  // Blue for browsers
          } else if (labelLower.includes('code') || labelLower.includes('xcode') || labelLower.includes('terminal')) {
            icon = '[>]';  // Dev
            color = '#00d4ff';  // Cyan for dev tools
          } else if (labelLower.includes('slack') || labelLower.includes('messages')) {
            icon = '[M]';  // Messages
            color = '#ff69b4';  // Pink for messaging
          }
        }

        // Format the label
        let label = block.label;
        if (block.call_provider) {
          label = `${this.getCallProviderName(block.call_provider)}`;
        }

        // Truncate label if too long
        if (label.length > 30) {
          label = label.substring(0, 27) + '...';
        }

        // Column-based format with colors
        // Add extra space after icon to handle emoji width issues in terminal
        const mainLine = `${icon}  {${color}-fg}${label.padEnd(32)}{/${color}-fg} {${colors.darkGray}-fg}${startTime}-${endTime}{/${colors.darkGray}-fg} {${colors.warning}-fg}${duration}{/${colors.warning}-fg}`;
        items.push(mainLine);

        // Add detail on next line if available and different from label
        if (block.detail && block.detail !== label && block.detail !== block.label) {
          const truncatedDetail = block.detail.length > 90
            ? block.detail.substring(0, 87) + '...'
            : block.detail;
          items.push(`   {${colors.gray}-fg}${truncatedDetail}{/${colors.gray}-fg}`);
        }

        items.push(''); // Empty line for spacing
      }
    }

    this.list.setItems(items);
    this.listBox.show();
    this.detailBox.show();
    this.list.focus();

    // Show details for first item
    if (this.timelineData.length > 0) {
      this.updateDetailPanel(0);
      this.list.select(0);
    }

    this.screen.render();
  }

  private updateDetailPanel(index: number) {
    if (index >= this.timelineData.length) {
      return;
    }

    const block = this.timelineData[index];
    this.selectedBlock = block;

    const startTime = new Date(block.start_ts).toLocaleString([], { hour12: false });
    const endTime = new Date(block.end_ts).toLocaleString([], { hour12: false });
    const duration = this.formatDuration(block.active_seconds);

    let content = '';

    const accentColor = colors.borderLight;
    const textColor = colors.lightGray;
    const durationColor = colors.warning;

    // Activity Type
    content += `{bold}{${colors.secondary}-fg}Activity Type{/${colors.secondary}-fg}{/bold}\n`;
    content += `{${textColor}-fg}${this.getKindDisplaySimple(block.kind)}{/${textColor}-fg}\n\n`;

    // Application/Label
    content += `{bold}{${colors.secondary}-fg}Application{/${colors.secondary}-fg}{/bold}\n`;
    content += `{${textColor}-fg}${block.label}{/${textColor}-fg}\n\n`;

    // Details
    if (block.detail) {
      content += `{bold}{${colors.secondary}-fg}Details{/${colors.secondary}-fg}{/bold}\n`;
      const detailLines = this.wrapText(block.detail, 34);
      detailLines.forEach(line => {
        content += `{${textColor}-fg}${line}{/${textColor}-fg}\n`;
      });
      content += `\n`;
    }

    // Time Range
    content += `{bold}{${colors.secondary}-fg}Time Range{/${colors.secondary}-fg}{/bold}\n`;
    content += `{${textColor}-fg}Start: ${startTime}{/${textColor}-fg}\n`;
    content += `{${textColor}-fg}End:   ${endTime}{/${textColor}-fg}\n\n`;

    // Duration
    content += `{bold}{${colors.secondary}-fg}Duration{/${colors.secondary}-fg}{/bold}\n`;
    content += `{${durationColor}-fg}${duration}{/${durationColor}-fg}\n\n`;

    // Call Provider (if applicable)
    if (block.call_provider) {
      content += `{bold}{${colors.secondary}-fg}Call Provider{/${colors.secondary}-fg}{/bold}\n`;
      content += `{${textColor}-fg}${this.getCallProviderName(block.call_provider)}{/${textColor}-fg}\n\n`;
    }

    this.detailBox.setContent(content);
    this.screen.render();
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxWidth) {
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = '';
        }
        if (word.length > maxWidth) {
          // Split long words
          for (let i = 0; i < word.length; i += maxWidth) {
            lines.push(word.substring(i, i + maxWidth));
          }
        } else {
          currentLine = word + ' ';
        }
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine) {
      lines.push(currentLine.trim());
    }

    return lines;
  }

  private getKindDisplay(kind: string): string {
    const displays: Record<string, string> = {
      'app': '{blue-fg}Application{/blue-fg}',
      'web': '{cyan-fg}Web Browser{/cyan-fg}',
      'call': '{green-fg}Call/Meeting{/green-fg}',
      'idle': '{gray-fg}Idle{/gray-fg}'
    };
    return displays[kind] || kind;
  }

  private getKindDisplaySimple(kind: string): string {
    const displays: Record<string, string> = {
      'app': 'Application',
      'web': 'Web Browser',
      'call': 'Call/Meeting',
      'idle': 'Idle'
    };
    return displays[kind] || kind;
  }

  hide() {
    this.listBox.hide();
    this.detailBox.hide();
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
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

