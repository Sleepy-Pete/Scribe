import blessed from 'blessed';

/**
 * Centralized color palette for the Scribe TUI
 */
export const colors = {
  // Primary colors
  primary: '#7D56F4',
  secondary: '#00d4ff',
  accent: '#00ffff',

  // Grayscale
  white: '#ffffff',
  lightGray: '#e0e0e0',
  gray: '#808080',
  darkGray: '#999999',
  black: '#000000',

  // Background colors
  bgDark: '#1a1a1a',
  bgDarker: '#0a0a0a',

  // Border colors (subtle, matching background)
  borderDark: '#333333',
  borderLight: '#4a4a4a',

  // Status colors
  success: '#00ff00',
  error: '#ff0000',
  warning: '#ffd700',
  info: '#ffa500',
};

/**
 * Centralized style configurations for blessed widgets
 */
export const styles = {
  header: {
    fg: colors.white,
    bg: colors.bgDark,
    bold: true,
  },

  tabBar: {
    fg: colors.white,
    bg: colors.bgDarker,
  },

  tabActive: {
    fg: colors.secondary,
    bold: true,
  },

  tabInactive: {
    fg: colors.gray,
  },

  contentContainer: {
    fg: colors.lightGray,
    bg: colors.bgDark,
  },

  statusBar: {
    fg: colors.black,
    bg: colors.accent,
    bold: true,
  },

  list: {
    fg: colors.white,
    bg: colors.bgDark,
    selected: {
      fg: colors.black,
      bg: colors.secondary,
      bold: true,
    },
    item: {
      fg: colors.lightGray,
    },
  },

  box: {
    border: {
      fg: colors.secondary,
    },
    fg: colors.white,
    bg: colors.bgDark,
  },

  text: {
    primary: colors.white,
    secondary: colors.gray,
    accent: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  },
};

/**
 * Common padding configurations
 */
export const padding = {
  none: { left: 0, right: 0, top: 0, bottom: 0 },
  small: { left: 1, right: 1, top: 0, bottom: 0 },
  medium: { left: 2, right: 2, top: 1, bottom: 1 },
  large: { left: 3, right: 3, top: 1, bottom: 1 },
  header: { left: 0, right: 0, top: 1, bottom: 0 },
  content: { left: 2, right: 2, top: 1, bottom: 1 },
};

/**
 * Helper functions for creating styled text with blessed tags
 */
export const styledText = {
  bold: (text: string) => `{bold}${text}{/bold}`,
  center: (text: string) => `{center}${text}{/center}`,

  // Color helpers
  primary: (text: string) => `{${colors.white}-fg}${text}{/${colors.white}-fg}`,
  secondary: (text: string) => `{${colors.gray}-fg}${text}{/${colors.gray}-fg}`,
  accent: (text: string) => `{${colors.secondary}-fg}${text}{/${colors.secondary}-fg}`,
  success: (text: string) => `{${colors.success}-fg}${text}{/${colors.success}-fg}`,
  error: (text: string) => `{${colors.error}-fg}${text}{/${colors.error}-fg}`,
  warning: (text: string) => `{${colors.warning}-fg}${text}{/${colors.warning}-fg}`,

  // Combined helpers
  boldAccent: (text: string) => `{${colors.secondary}-fg}{bold}${text}{/bold}{/${colors.secondary}-fg}`,
  boldSuccess: (text: string) => `{${colors.success}-fg}{bold}${text}{/bold}{/${colors.success}-fg}`,
  boldError: (text: string) => `{${colors.error}-fg}{bold}${text}{/bold}{/${colors.error}-fg}`,

  // Tab helpers
  tabActive: (text: string) => `{${colors.secondary}-fg}{bold} ${text} {/bold}{/${colors.secondary}-fg}`,
  tabInactive: (text: string) => `{${colors.gray}-fg} ${text} {/${colors.gray}-fg}`,
};

