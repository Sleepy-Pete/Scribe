import blessed from 'blessed';
import { ApiClient } from '../api-client';
import { styles, colors, styledText } from '../styles';

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
  }

  async show() {
    const settings = await this.apiClient.getSettings();
    const health = await this.apiClient.getHealth();

    const items: string[] = [
      styledText.boldAccent('SETTINGS & CONFIGURATION'),
      `{${colors.borderLight}-fg}${'═'.repeat(80)}{/${colors.borderLight}-fg}`,
      '',
      styledText.bold(`{${colors.lightGray}-fg}System Information{/${colors.lightGray}-fg}`),
      `{${colors.borderLight}-fg}${'─'.repeat(80)}{/${colors.borderLight}-fg}`,
      `  {${colors.success}-fg}API Status: ✓ Connected{/${colors.success}-fg}`,
      `  {${colors.lightGray}-fg}Database: ${health.database}{/${colors.lightGray}-fg}`,
      `  {${colors.darkGray}-fg}API Endpoint: http://127.0.0.1:3737{/${colors.darkGray}-fg}`,
      '',
      styledText.bold(`{${colors.lightGray}-fg}Tracker Settings{/${colors.lightGray}-fg}`),
      `{${colors.borderLight}-fg}${'─'.repeat(80)}{/${colors.borderLight}-fg}`,
    ];

    const pollingInterval = settings['polling_interval_ms'] || '1000';
    const idleTimeout = settings['idle_timeout_seconds'] || '60';
    const privacyMode = settings['privacy_mode'] || 'false';

    items.push(`  {${colors.lightGray}-fg}Polling Interval:{/${colors.lightGray}-fg} {${colors.warning}-fg}${pollingInterval}ms{/${colors.warning}-fg} {${colors.darkGray}-fg}(${parseInt(pollingInterval) / 1000}s){/${colors.darkGray}-fg}`);
    items.push(`  {${colors.lightGray}-fg}Idle Timeout:{/${colors.lightGray}-fg} {${colors.warning}-fg}${idleTimeout}s{/${colors.warning}-fg} {${colors.darkGray}-fg}(${parseInt(idleTimeout) / 60}min){/${colors.darkGray}-fg}`);
    items.push(`  {${colors.lightGray}-fg}Privacy Mode:{/${colors.lightGray}-fg} {${colors.info}-fg}${privacyMode === 'true' ? 'Enabled' : 'Disabled'}{/${colors.info}-fg}`);
    items.push('');

    items.push(styledText.bold(`{${colors.lightGray}-fg}Obsidian Integration{/${colors.lightGray}-fg}`));
    items.push(`{${colors.borderLight}-fg}${'─'.repeat(80)}{/${colors.borderLight}-fg}`);
    const vaultPath = settings['obsidian_vault_path'] || 'Not configured';
    const autoExport = settings['obsidian_auto_export'] || 'false';
    const exportTime = settings['obsidian_export_time'] || 'Not set';

    items.push(`  {${colors.lightGray}-fg}Vault Path:{/${colors.lightGray}-fg} {${colors.secondary}-fg}${vaultPath}{/${colors.secondary}-fg}`);
    items.push(`  {${colors.lightGray}-fg}Auto Export:{/${colors.lightGray}-fg} {${colors.info}-fg}${autoExport === 'true' ? 'Enabled' : 'Disabled'}{/${colors.info}-fg}`);
    items.push(`  {${colors.lightGray}-fg}Export Time:{/${colors.lightGray}-fg} {${colors.warning}-fg}${exportTime}{/${colors.warning}-fg}`);
    items.push('');

    items.push(styledText.bold(`{${colors.lightGray}-fg}Data Export{/${colors.lightGray}-fg}`));
    items.push(`{${colors.borderLight}-fg}${'─'.repeat(80)}{/${colors.borderLight}-fg}`);
    items.push(`  {${colors.lightGray}-fg}Export formats available via API:{/${colors.lightGray}-fg}`);
    items.push(`    {${colors.secondary}-fg}• JSON:{/${colors.secondary}-fg} {${colors.darkGray}-fg}GET /api/export?format=json{/${colors.darkGray}-fg}`);
    items.push(`    {${colors.secondary}-fg}• CSV:{/${colors.secondary}-fg}  {${colors.darkGray}-fg}GET /api/export?format=csv{/${colors.darkGray}-fg}`);
    items.push(`    {${colors.secondary}-fg}• Obsidian:{/${colors.secondary}-fg} {${colors.darkGray}-fg}POST /api/obsidian/export{/${colors.darkGray}-fg}`);
    items.push('');

    items.push(styledText.bold(`{${colors.lightGray}-fg}All Settings{/${colors.lightGray}-fg}`));
    items.push(`{${colors.borderLight}-fg}${'─'.repeat(80)}{/${colors.borderLight}-fg}`);
    const settingKeys = Object.keys(settings).sort();
    if (settingKeys.length === 0) {
      items.push(`  {${colors.darkGray}-fg}No custom settings configured.{/${colors.darkGray}-fg}`);
    } else {
      for (const key of settingKeys) {
        const value = settings[key];
        items.push(`  {${colors.secondary}-fg}${key}:{/${colors.secondary}-fg} {${colors.lightGray}-fg}${value}{/${colors.lightGray}-fg}`);
      }
    }
    items.push('');
    items.push(`{${colors.darkGray}-fg}Note: Settings can be modified via the API using PUT /api/settings/:key{/${colors.darkGray}-fg}`);

    this.settingsList.setItems(items);
    this.settingsList.show();
    this.settingsList.focus();
    this.screen.render();
  }

  hide() {
    this.settingsList.hide();
  }
}

