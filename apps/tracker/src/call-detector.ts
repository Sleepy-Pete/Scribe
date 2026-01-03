import { CallProvider } from '@scribe/types';

export interface CallDetectionResult {
  isCall: boolean;
  provider?: CallProvider;
}

/**
 * Detect if current activity is a call based on app/window/domain patterns
 */
export function detectCall(
  appName?: string,
  windowTitle?: string,
  domain?: string,
  url?: string
): CallDetectionResult {
  const appLower = appName?.toLowerCase() || '';
  const windowLower = windowTitle?.toLowerCase() || '';
  const domainLower = domain?.toLowerCase() || '';
  const urlLower = url?.toLowerCase() || '';

  // Google Meet
  if (
    domainLower.includes('meet.google.com') ||
    (windowLower.includes('meet') && domainLower.includes('google'))
  ) {
    return { isCall: true, provider: 'meet' };
  }

  // Discord - Enhanced detection
  if (appLower.includes('discord')) {
    if (
      windowLower.includes('voice') ||
      windowLower.includes('call') ||
      windowLower.includes('video') ||
      windowLower.includes('screen share') ||
      windowLower.includes('screenshare') ||
      windowLower.includes('streaming') ||
      windowLower.includes('live') ||
      windowLower.includes('voice channel') ||
      windowLower.includes('stage channel') ||
      windowLower.includes('🔊') ||
      windowLower.includes('🎤') ||
      windowLower.includes('🔇') ||
      windowLower.includes('muted') ||
      windowLower.includes('unmuted')
    ) {
      return { isCall: true, provider: 'discord' };
    }
  }

  // Zoom
  if (
    appLower.includes('zoom') ||
    domainLower.includes('zoom.us') ||
    windowLower.includes('zoom meeting')
  ) {
    return { isCall: true, provider: 'zoom' };
  }

  // Slack huddle
  if (
    appLower.includes('slack') &&
    windowLower.includes('huddle')
  ) {
    return { isCall: true, provider: 'slack' };
  }

  // Microsoft Teams
  if (
    appLower.includes('teams') ||
    appLower.includes('microsoft teams')
  ) {
    if (
      windowLower.includes('meeting') ||
      windowLower.includes('call') ||
      windowLower.includes('video')
    ) {
      return { isCall: true, provider: 'other' };
    }
  }

  // FaceTime
  if (appLower.includes('facetime')) {
    return { isCall: true, provider: 'other' };
  }

  return { isCall: false };
}

