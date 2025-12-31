import blessed from 'blessed';
import { ApiClient } from '../api-client';
import { TimelineBlock } from '@scribe/types';

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
          fg: '#00ffff'
        },
        bg: '#1a1a1a'
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
          fg: '#00ffff'
        },
        bg: '#1a1a1a'
      },
      label: ' Details ',
      padding: {
        left: 1,
        right: 1,
        top: 1
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: '█',
        track: {
          bg: '#1a1a1a'
        },
        style: {
          bg: '#00ffff'
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
      items.push(`{bold}{cyan-fg}Total: ${this.formatDuration(totalSeconds)} | Activities: ${timeline.length}{/cyan-fg}{/bold}`);
      items.push('');

      for (let i = 0; i < this.timelineData.length; i++) {
        const block = this.timelineData[i];
        const startTime = new Date(block.start_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(block.end_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const duration = this.formatDuration(block.active_seconds);

        // Determine icon and color based on kind
        let icon = '💻';
        let color = 'white';
        const labelLower = block.label.toLowerCase();

        if (block.kind === 'call') {
          icon = '📞';
          color = 'green';
        } else if (block.kind === 'web') {
          icon = '🌐';
          color = 'blue';
        } else if (block.kind === 'app') {
          // Categorize apps by name
          if (labelLower.includes('discord')) {
            icon = '💬';
            color = 'magenta';
          } else if (labelLower.includes('obsidian')) {
            icon = '📝';
            color = 'yellow';
          } else if (labelLower.includes('chrome') || labelLower.includes('safari') || labelLower.includes('firefox')) {
            icon = '🌐';
            color = 'blue';
          } else if (labelLower.includes('code') || labelLower.includes('xcode') || labelLower.includes('terminal')) {
            icon = '⌨️';
            color = 'cyan';
          } else if (labelLower.includes('slack') || labelLower.includes('messages')) {
            icon = '💬';
            color = 'magenta';
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
        const mainLine = `${icon} {${color}-fg}${label.padEnd(32)}{/${color}-fg} {gray-fg}${startTime}-${endTime}{/gray-fg} {cyan-fg}${duration}{/cyan-fg}`;
        items.push(mainLine);

        // Add detail on next line if available and different from label
        if (block.detail && block.detail !== label && block.detail !== block.label) {
          const truncatedDetail = block.detail.length > 90
            ? block.detail.substring(0, 87) + '...'
            : block.detail;
          items.push(`   {gray-fg}${truncatedDetail}{/gray-fg}`);
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

    const startTime = new Date(block.start_ts).toLocaleString();
    const endTime = new Date(block.end_ts).toLocaleString();
    const duration = this.formatDuration(block.active_seconds);

    let content = '';

    // Activity Type
    content += `{bold}{cyan-fg}┌─ Activity Type{/cyan-fg}{/bold}\n`;
    content += `{cyan-fg}│{/cyan-fg} {white-fg}${this.getKindDisplaySimple(block.kind)}{/white-fg}\n`;
    content += `{cyan-fg}└{/cyan-fg}${'─'.repeat(35)}\n\n`;

    // Application/Label
    content += `{bold}{cyan-fg}┌─ Application{/cyan-fg}{/bold}\n`;
    content += `{cyan-fg}│{/cyan-fg} {white-fg}${block.label}{/white-fg}\n`;
    content += `{cyan-fg}└{/cyan-fg}${'─'.repeat(35)}\n\n`;

    // Details
    if (block.detail) {
      content += `{bold}{cyan-fg}┌─ Details{/cyan-fg}{/bold}\n`;
      const detailLines = this.wrapText(block.detail, 33);
      detailLines.forEach(line => {
        content += `{cyan-fg}│{/cyan-fg} {white-fg}${line}{/white-fg}\n`;
      });
      content += `{cyan-fg}└{/cyan-fg}${'─'.repeat(35)}\n\n`;
    }

    // Time Range
    content += `{bold}{cyan-fg}┌─ Time Range{/cyan-fg}{/bold}\n`;
    content += `{cyan-fg}│{/cyan-fg} {white-fg}Start: ${startTime}{/white-fg}\n`;
    content += `{cyan-fg}│{/cyan-fg} {white-fg}End:   ${endTime}{/white-fg}\n`;
    content += `{cyan-fg}└{/cyan-fg}${'─'.repeat(35)}\n\n`;

    // Duration
    content += `{bold}{cyan-fg}┌─ Duration{/cyan-fg}{/bold}\n`;
    content += `{cyan-fg}│{/cyan-fg} {yellow-fg}${duration}{/yellow-fg}\n`;
    content += `{cyan-fg}└{/cyan-fg}${'─'.repeat(35)}\n\n`;

    // Call Provider (if applicable)
    if (block.call_provider) {
      content += `{bold}{cyan-fg}┌─ Call Provider{/cyan-fg}{/bold}\n`;
      content += `{cyan-fg}│{/cyan-fg} {white-fg}${this.getCallProviderName(block.call_provider)}{/white-fg}\n`;
      content += `{cyan-fg}└{/cyan-fg}${'─'.repeat(35)}\n\n`;
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

