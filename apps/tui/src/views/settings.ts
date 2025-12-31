import blessed from 'blessed';
import { ApiClient } from '../api-client';

export class SettingsView {
  private screen: blessed.Widgets.Screen;
  private container: blessed.Widgets.BoxElement;
  private apiClient: ApiClient;
  private settingsList: blessed.Widgets.ListElement;

  constructor(screen: blessed.Widgets.Screen, container: blessed.Widgets.BoxElement, apiClient: ApiClient) {
    this.screen = screen;
    this.container = container;
    this.apiClient = apiClient;

    // Create settings list
    this.settingsList = blessed.list({
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
    const settings = await this.apiClient.getSettings();
    const health = await this.apiClient.getHealth();

    const items: string[] = [
      'SETTINGS & CONFIGURATION',
      '═'.repeat(80),
      '',
      'System Information',
      '─'.repeat(80),
      '  API Status: ✓ Connected',
      `  Database: ${health.database}`,
      '  API Endpoint: http://127.0.0.1:3737',
      '',
      'Tracker Settings',
      '─'.repeat(80),
    ];

    const pollingInterval = settings['polling_interval_ms'] || '1000';
    const idleTimeout = settings['idle_timeout_seconds'] || '60';
    const privacyMode = settings['privacy_mode'] || 'false';

    items.push(`  Polling Interval: ${pollingInterval}ms (${parseInt(pollingInterval) / 1000}s)`);
    items.push(`  Idle Timeout: ${idleTimeout}s (${parseInt(idleTimeout) / 60}min)`);
    items.push(`  Privacy Mode: ${privacyMode === 'true' ? 'Enabled' : 'Disabled'}`);
    items.push('');

    items.push('Obsidian Integration');
    items.push('─'.repeat(80));
    const vaultPath = settings['obsidian_vault_path'] || 'Not configured';
    const autoExport = settings['obsidian_auto_export'] || 'false';
    const exportTime = settings['obsidian_export_time'] || 'Not set';

    items.push(`  Vault Path: ${vaultPath}`);
    items.push(`  Auto Export: ${autoExport === 'true' ? 'Enabled' : 'Disabled'}`);
    items.push(`  Export Time: ${exportTime}`);
    items.push('');

    items.push('Data Export');
    items.push('─'.repeat(80));
    items.push('  Export formats available via API:');
    items.push('    • JSON: GET /api/export?format=json');
    items.push('    • CSV:  GET /api/export?format=csv');
    items.push('    • Obsidian: POST /api/obsidian/export');
    items.push('');

    items.push('All Settings');
    items.push('─'.repeat(80));
    const settingKeys = Object.keys(settings).sort();
    if (settingKeys.length === 0) {
      items.push('  No custom settings configured.');
    } else {
      for (const key of settingKeys) {
        const value = settings[key];
        items.push(`  ${key}: ${value}`);
      }
    }
    items.push('');
    items.push('Note: Settings can be modified via the API using PUT /api/settings/:key');

    this.settingsList.setItems(items);
    this.settingsList.show();
    this.settingsList.focus();
    this.screen.render();
  }

  hide() {
    this.settingsList.hide();
  }
}

