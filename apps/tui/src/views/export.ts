import blessed from 'blessed';
import { ApiClient } from '../api-client';
import { styles, colors, styledText } from '../styles';
import { DateSummary } from '@scribe/types';

export class ExportView {
  private screen: blessed.Widgets.Screen;
  private container: blessed.Widgets.BoxElement;
  private apiClient: ApiClient;
  private datesList: blessed.Widgets.ListElement;
  private dates: DateSummary[] = [];
  private onExport?: (date: string) => void;
  private selectedIndex: number = 0;

  constructor(
    screen: blessed.Widgets.Screen,
    container: blessed.Widgets.BoxElement,
    apiClient: ApiClient,
    onExport?: (date: string) => void
  ) {
    this.screen = screen;
    this.container = container;
    this.apiClient = apiClient;
    this.onExport = onExport;

    // Create dates list
    this.datesList = blessed.list({
      parent: container,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
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
      },
      hidden: true
    });

    // Track selection changes
    this.datesList.on('select', (item, index) => {
      this.selectedIndex = index;
    });

    // Handle selection (Enter or 'e' key)
    this.datesList.key(['enter', 'e'], () => {
      // Skip header lines (first 6 lines: title, separator, blank, instruction, separator, blank)
      const dateIndex = this.selectedIndex - 6;
      if (dateIndex >= 0 && dateIndex < this.dates.length) {
        const selectedDate = this.dates[dateIndex];
        if (this.onExport) {
          this.onExport(selectedDate.date);
        }
      }
    });
  }

  async show() {
    try {
      this.dates = await this.apiClient.getAvailableDates();

      const items: string[] = [
        styledText.boldAccent('EXPORT DATA BY DATE'),
        `{${colors.borderLight}-fg}${'═'.repeat(80)}{/${colors.borderLight}-fg}`,
        '',
      ];

      if (this.dates.length === 0) {
        items.push(`{${colors.darkGray}-fg}No data available to export.{/${colors.darkGray}-fg}`);
        items.push('');
        items.push(`{${colors.lightGray}-fg}Start using your computer and the tracker will record your activity.{/${colors.lightGray}-fg}`);
      } else {
        items.push(`{${colors.lightGray}-fg}Select a date and press {/${colors.lightGray}-fg}{${colors.warning}-fg}Enter{/${colors.warning}-fg}{${colors.lightGray}-fg} or {/${colors.lightGray}-fg}{${colors.warning}-fg}e{/${colors.warning}-fg}{${colors.lightGray}-fg} to export to Obsidian{/${colors.lightGray}-fg}`);
        items.push(`{${colors.borderLight}-fg}${'─'.repeat(80)}{/${colors.borderLight}-fg}`);
        items.push('');

        for (const dateSummary of this.dates) {
          const formattedDate = this.formatDate(dateSummary.date);
          const duration = this.formatDuration(dateSummary.total_active_seconds);
          const eventCount = dateSummary.event_count;

          // Create a formatted line with date, duration, and event count
          items.push(
            `  {${colors.secondary}-fg}${formattedDate}{/${colors.secondary}-fg}  ` +
            `{${colors.warning}-fg}${duration}{/${colors.warning}-fg}  ` +
            `{${colors.darkGray}-fg}(${eventCount} events){/${colors.darkGray}-fg}`
          );
        }
      }

      this.datesList.setItems(items);
      this.datesList.show();
      this.datesList.focus();
      this.screen.render();
    } catch (error: any) {
      const items: string[] = [
        styledText.boldAccent('EXPORT DATA BY DATE'),
        `{${colors.borderLight}-fg}${'═'.repeat(80)}{/${colors.borderLight}-fg}`,
        '',
        styledText.error(`Error loading dates: ${error.message}`),
      ];
      this.datesList.setItems(items);
      this.datesList.show();
      this.datesList.focus();
      this.screen.render();
    }
  }

  hide() {
    this.datesList.hide();
  }

  private formatDate(dateStr: string): string {
    // dateStr is in YYYY-MM-DD format
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

