import blessed from 'blessed';
import { ScribeTUI } from './tui';

// Clear console before starting TUI
console.clear();

// Redirect console output to prevent bleeding into TUI
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = () => {};
console.error = () => {};
console.warn = () => {};

// Create the TUI application
const tui = new ScribeTUI();

// Handle graceful shutdown
process.on('SIGINT', () => {
  // Restore console
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;

  tui.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  // Restore console
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;

  tui.destroy();
  process.exit(0);
});

// Start the TUI
tui.start();

