import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get system idle time in seconds (macOS only)
 * Uses ioreg to query HIDIdleTime
 */
export async function getSystemIdleTime(): Promise<number> {
  try {
    const { stdout } = await execAsync('ioreg -c IOHIDSystem | grep HIDIdleTime');
    // Output format: "HIDIdleTime" = 12345678900
    const match = stdout.match(/HIDIdleTime"\s*=\s*(\d+)/);
    if (match) {
      const nanoseconds = parseInt(match[1]);
      const seconds = nanoseconds / 1_000_000_000;
      return seconds;
    }
    return 0;
  } catch (error) {
    console.error('[IdleDetector] Error getting idle time:', error);
    return 0;
  }
}

/**
 * Check if system is idle based on threshold
 */
export async function isSystemIdle(thresholdSeconds: number): Promise<boolean> {
  const idleTime = await getSystemIdleTime();
  return idleTime >= thresholdSeconds;
}

