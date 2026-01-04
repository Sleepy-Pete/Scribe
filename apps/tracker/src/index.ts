import activeWin from 'active-win';
import { SessionManager } from './session-manager';
import { isSystemIdle } from './idle-detector';
import { getSetting } from '@scribe/database';

class ActivityTracker {
  private sessionManager: SessionManager;
  private pollingInterval: number = 1000; // ms
  private idleTimeout: number = 60; // seconds
  private intervalId?: NodeJS.Timeout;
  private isIdle: boolean = false;
  private hasWarnedAboutPermissions: boolean = false;

  constructor() {
    this.sessionManager = new SessionManager();
    this.loadSettings();
  }

  private loadSettings() {
    const pollingIntervalSetting = getSetting('polling_interval_ms');
    const idleTimeoutSetting = getSetting('idle_timeout_seconds');

    if (pollingIntervalSetting) {
      this.pollingInterval = parseInt(pollingIntervalSetting);
    }
    if (idleTimeoutSetting) {
      this.idleTimeout = parseInt(idleTimeoutSetting);
    }

    console.log(`[Tracker] Settings loaded: polling=${this.pollingInterval}ms, idle=${this.idleTimeout}s`);
  }

  async start() {
    console.log('[Tracker] Starting activity tracker...');
    console.log('[Tracker] Polling interval:', this.pollingInterval, 'ms');
    console.log('[Tracker] Idle timeout:', this.idleTimeout, 'seconds');

    // Initial poll
    await this.poll();

    // Start polling loop
    this.intervalId = setInterval(() => {
      this.poll().catch(err => {
        console.error('[Tracker] Poll error:', err);
      });
    }, this.pollingInterval);

    console.log('[Tracker] Tracker started successfully');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('[Tracker] Tracker stopped');
  }

  /**
   * Check if the current activity is the tracker itself
   * Returns true if we should skip tracking this activity
   */
  private isTrackerActivity(appName: string, windowTitle: string): boolean {
    const appLower = appName.toLowerCase();
    const titleLower = windowTitle.toLowerCase();

    // Check if it's a terminal app
    const isTerminal = appLower.includes('terminal') ||
                      appLower.includes('iterm') ||
                      appLower.includes('warp') ||
                      appLower.includes('alacritty') ||
                      appLower.includes('kitty') ||
                      appLower.includes('hyper');

    if (!isTerminal) {
      return false;
    }

    // Check if the terminal is running tracker-related commands or viewing logs
    const trackerKeywords = [
      'tracker',
      'scribe',
      '/scribe',
      'npm run dev',
      'npm start',
      'concurrently',
      'tracker.log',
      'api.log',
      'apps/tracker',
      'apps/api',
      'apps/tui'
    ];

    return trackerKeywords.some(keyword => titleLower.includes(keyword));
  }

  private async poll() {
    try {
      // Check for idle state
      const idle = await isSystemIdle(this.idleTimeout);

      if (idle && !this.isIdle) {
        console.log('[Tracker] System is now idle');
        this.isIdle = true;
        this.sessionManager.handleIdle();
        return;
      } else if (!idle && this.isIdle) {
        console.log('[Tracker] System is now active');
        this.isIdle = false;
      }

      if (idle) {
        // Don't track while idle
        return;
      }

      // Get active window
      const window = await activeWin();

      if (!window) {
        console.log('[Tracker] No active window detected');
        return;
      }

      const { owner, title } = window;
      // active-win returns url for browsers but TypeScript types don't include it
      const url = (window as any).url as string | undefined;
      const appName = owner.name;
      const processName = owner.processId.toString();

      // Use title, or fall back to URL for browsers (workaround for active-win Chrome bug)
      // See: https://github.com/sindresorhus/get-windows/issues/188
      let windowTitle = title || '';
      if (!windowTitle && url) {
        // Extract domain and path from URL as fallback title
        try {
          const urlObj = new URL(url);
          // Create a readable title from the URL
          windowTitle = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
          // Truncate if too long
          if (windowTitle.length > 100) {
            windowTitle = windowTitle.substring(0, 100) + '...';
          }
        } catch {
          windowTitle = url;
        }
      }

      // Skip tracking if this is the tracker itself
      // Don't track terminals running the tracker or viewing tracker logs
      if (this.isTrackerActivity(appName, windowTitle)) {
        console.log('[Tracker] Skipping tracker self-activity');
        return;
      }

      // Check for missing Screen Recording permission
      // On macOS 10.15+, active-win returns empty title if permission not granted
      if (!windowTitle && !this.hasWarnedAboutPermissions) {
        const appLower = appName.toLowerCase();
        const isBrowser = appLower.includes('chrome') || appLower.includes('safari') ||
                         appLower.includes('firefox') || appLower.includes('edge') ||
                         appLower.includes('brave') || appLower.includes('arc');

        if (isBrowser) {
          console.warn('\n╔════════════════════════════════════════════════════════════════╗');
          console.warn('║  ⚠️  SCREEN RECORDING PERMISSION REQUIRED                     ║');
          console.warn('╠════════════════════════════════════════════════════════════════╣');
          console.warn('║  Browser window titles are empty!                              ║');
          console.warn('║  Chrome activities will only show "Google Chrome" without      ║');
          console.warn('║  page titles or domain information.                            ║');
          console.warn('║                                                                ║');
          console.warn('║  🔧 To fix:                                                    ║');
          console.warn('║    1. Open System Settings > Privacy & Security                ║');
          console.warn('║    2. Click "Screen Recording"                                 ║');
          console.warn('║    3. Enable permission for your Terminal app                  ║');
          console.warn('║       (Terminal, iTerm2, or whatever you\'re using)             ║');
          console.warn('║    4. Restart this tracker                                     ║');
          console.warn('╚════════════════════════════════════════════════════════════════╝\n');
          this.hasWarnedAboutPermissions = true;
        }
      }

      // Handle app activity
      this.sessionManager.handleAppActivity(appName, processName, windowTitle);

    } catch (error: any) {
      if (error.message?.includes('screen recording permission')) {
        console.error('[Tracker] ⚠️  Screen recording permission required!');
        console.error('[Tracker] Please grant permission in System Preferences > Security & Privacy > Privacy > Screen Recording');
      } else if (error.message?.includes('accessibility permission')) {
        console.error('[Tracker] ⚠️  Accessibility permission required!');
        console.error('[Tracker] Please grant permission in System Preferences > Security & Privacy > Privacy > Accessibility');
      } else {
        console.error('[Tracker] Error polling active window:', error);
      }
    }
  }
}

// Start tracker
const tracker = new ActivityTracker();
tracker.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Tracker] Received SIGINT, shutting down...');
  tracker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Tracker] Received SIGTERM, shutting down...');
  tracker.stop();
  process.exit(0);
});

