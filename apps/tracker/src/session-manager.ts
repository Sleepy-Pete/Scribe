import { ActivityEvent, EventKind, CallProvider } from '@scribe/types';
import { insertEvent, updateEvent, getSetting } from '@scribe/database';
import { detectCall } from './call-detector';

interface ActiveSession {
  eventId: number;
  kind: EventKind;
  appName?: string;
  processName?: string;
  windowTitle?: string;
  domain?: string;
  url?: string;
  startTs: number;
  lastUpdateTs: number;
  activeSeconds: number;
}

export class SessionManager {
  private currentSession: ActiveSession | null = null;
  private privacyMode: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const privacySetting = getSetting('privacy_mode');
    this.privacyMode = privacySetting === 'true';
  }

  /**
   * Handle app activity
   */
  handleAppActivity(appName: string, processName: string, windowTitle: string): void {
    const now = Date.now();
    const sanitizedWindowTitle = this.privacyMode ? this.sanitizeWindowTitle(windowTitle) : windowTitle;

    // Check if this continues the current session
    if (this.currentSession && this.isSameAppSession(appName, processName, sanitizedWindowTitle)) {
      // Continue current session - just update end timestamp
      // active_seconds will be calculated from (end_ts - start_ts)
      this.currentSession.lastUpdateTs = now;
      this.currentSession.windowTitle = sanitizedWindowTitle; // Update to latest window title

      // Calculate active_seconds from timestamps to avoid rounding errors
      const activeSeconds = Math.floor((now - this.currentSession.startTs) / 1000);
      this.currentSession.activeSeconds = activeSeconds;

      // Update database with latest window title and timestamps
      updateEvent(this.currentSession.eventId, {
        window_title: sanitizedWindowTitle,
        end_ts: now,
        active_seconds: activeSeconds
      });
    } else {
      // End current session and start new one
      this.endCurrentSession(now);
      this.startAppSession(appName, processName, sanitizedWindowTitle, now);
    }
  }

  /**
   * Handle idle state
   */
  handleIdle(): void {
    if (this.currentSession) {
      this.endCurrentSession(Date.now());
    }
  }

  /**
   * Extract domain from browser window title
   * Examples:
   *   "YouTube" -> "youtube.com"
   *   "Google Search - Google Chrome" -> "google.com"
   *   "reddit.com: dive into anything" -> "reddit.com"
   */
  private extractDomainFromTitle(windowTitle: string): string | null {
    const titleLower = windowTitle.toLowerCase();

    // Common patterns in browser window titles
    const domainPatterns = [
      // Direct domain mentions
      /(?:^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,})(?:\s|:|$)/i,
      // YouTube specific
      /youtube/i,
      // Google specific
      /google/i,
      // Reddit specific
      /reddit/i,
      // GitHub specific
      /github/i,
      // Twitter/X specific
      /twitter|^x\s/i,
      // LinkedIn specific
      /linkedin/i,
      // Facebook specific
      /facebook/i,
      // Common sites
      /stackoverflow|stack overflow/i,
      /medium\.com|medium/i,
      /netflix/i,
      /amazon/i,
    ];

    for (const pattern of domainPatterns) {
      const match = titleLower.match(pattern);
      if (match) {
        // Normalize common site names
        const matched = match[1] || match[0];
        if (matched.includes('youtube')) return 'youtube.com';
        if (matched.includes('google')) return 'google.com';
        if (matched.includes('reddit')) return 'reddit.com';
        if (matched.includes('github')) return 'github.com';
        if (matched.includes('twitter') || matched === 'x') return 'twitter.com';
        if (matched.includes('linkedin')) return 'linkedin.com';
        if (matched.includes('facebook')) return 'facebook.com';
        if (matched.includes('stackoverflow') || matched.includes('stack overflow')) return 'stackoverflow.com';
        if (matched.includes('medium')) return 'medium.com';
        if (matched.includes('netflix')) return 'netflix.com';
        if (matched.includes('amazon')) return 'amazon.com';

        // Return the matched domain as-is if it looks like a domain
        if (matched.includes('.')) return matched;
      }
    }

    return null;
  }

  /**
   * Check if activity continues the same session
   *
   * Strategy:
   * - Browsers: Group by domain (extracted from window title), or by exact window title if domain can't be extracted
   * - Communication apps: Ignore window title changes completely
   * - Other apps: Require exact window title match
   */
  private isSameAppSession(appName: string, processName: string, windowTitle: string): boolean {
    if (!this.currentSession) return false;

    const appLower = appName.toLowerCase();
    const isBrowser =
      appLower.includes('chrome') ||
      appLower.includes('safari') ||
      appLower.includes('firefox') ||
      appLower.includes('edge') ||
      appLower.includes('brave') ||
      appLower.includes('arc');

    const isCommunicationApp =
      appLower.includes('discord') ||
      appLower.includes('slack') ||
      appLower.includes('messages') ||
      appLower.includes('mail') ||
      appLower.includes('outlook');

    if (isBrowser) {
      // For browsers, try to match on app + domain
      const currentDomain = this.extractDomainFromTitle(this.currentSession.windowTitle || '');
      const newDomain = this.extractDomainFromTitle(windowTitle);

      console.log(`[SessionManager] Browser session check: currentDomain="${currentDomain}", newDomain="${newDomain}", windowTitle="${windowTitle}"`);

      // If we can extract domains from both, match by domain
      if (currentDomain !== null && newDomain !== null) {
        const matches = (
          this.currentSession.appName === appName &&
          this.currentSession.processName === processName &&
          currentDomain === newDomain
        );
        console.log(`[SessionManager] Domain match: ${matches}`);
        return matches;
      }

      // If both have no extractable domain, match by exact window title
      // This prevents creating a new session every second for pages like "ChatGPT"
      if (currentDomain === null && newDomain === null) {
        const matches = (
          this.currentSession.appName === appName &&
          this.currentSession.processName === processName &&
          this.currentSession.windowTitle === windowTitle
        );
        console.log(`[SessionManager] Window title match (both no domain): ${matches}`);
        return matches;
      }

      // If one has a domain and the other doesn't, treat as different sessions
      // This handles transitions between different types of pages
      console.log(`[SessionManager] Domain mismatch (one null, one not): creating new session`);
      return false;
    }

    if (isCommunicationApp) {
      // For communication apps, only match on app name and process
      return (
        this.currentSession.appName === appName &&
        this.currentSession.processName === processName
      );
    }

    // For other apps (like VS Code, Terminal), require exact window title match
    return (
      this.currentSession.appName === appName &&
      this.currentSession.processName === processName &&
      this.currentSession.windowTitle === windowTitle
    );
  }

  /**
   * Start a new app session
   */
  private startAppSession(appName: string, processName: string, windowTitle: string, timestamp: number): void {
    // Detect if this is a call
    const callDetection = detectCall(appName, windowTitle);

    const event: Omit<ActivityEvent, 'id'> = {
      kind: callDetection.isCall ? 'call' : 'app',
      app_name: appName,
      process_name: processName,
      window_title: windowTitle,
      call_provider: callDetection.provider,
      start_ts: timestamp,
      end_ts: timestamp,
      active_seconds: 0,
      privacy_redacted: this.privacyMode
    };

    const eventId = insertEvent(event);

    this.currentSession = {
      eventId,
      kind: event.kind,
      appName,
      processName,
      windowTitle,
      startTs: timestamp,
      lastUpdateTs: timestamp,
      activeSeconds: 0
    };

    console.log(`[SessionManager] Started new ${event.kind} session: ${appName} - ${windowTitle}`);
  }

  /**
   * End the current session
   */
  private endCurrentSession(timestamp: number): void {
    if (!this.currentSession) return;

    // Calculate active_seconds from timestamps to avoid rounding errors
    const activeSeconds = Math.floor((timestamp - this.currentSession.startTs) / 1000);

    updateEvent(this.currentSession.eventId, {
      end_ts: timestamp,
      active_seconds: activeSeconds
    });

    console.log(`[SessionManager] Ended session: ${this.currentSession.appName} (${activeSeconds}s)`);
    this.currentSession = null;
  }

  /**
   * Sanitize window title for privacy mode
   */
  private sanitizeWindowTitle(title: string): string {
    // Remove potential sensitive patterns
    return title
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]');
  }
}

