#!/bin/bash

echo "🔍 Verifying Chrome Title Detection..."
echo ""

# Test with active-win
node -e "
const activeWin = require('active-win');

(async () => {
  console.log('Testing active-win with current active window...\n');
  
  const window = await activeWin();
  
  if (!window) {
    console.log('❌ No window detected');
    process.exit(1);
  }
  
  console.log('App:', window.owner.name);
  console.log('Title:', window.title ? '\"' + window.title + '\"' : '(empty)');
  console.log('');
  
  const isChrome = window.owner.name.toLowerCase().includes('chrome');
  const hasTitle = window.title && window.title.trim() !== '';
  
  if (isChrome && hasTitle) {
    console.log('✅ SUCCESS! Chrome window title is now being captured!');
    console.log('');
    console.log('The tracker will now show Chrome page titles in the TUI.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Make sure the tracker is running: ./start-tui.sh');
    console.log('  2. Browse some websites in Chrome');
    console.log('  3. Check the TUI timeline - you should see page titles!');
    process.exit(0);
  } else if (isChrome && !hasTitle) {
    console.log('❌ STILL NOT WORKING');
    console.log('');
    console.log('Chrome title is still empty. Please:');
    console.log('  1. Make sure you QUIT Terminal completely (Cmd+Q)');
    console.log('  2. Reopen Terminal');
    console.log('  3. Verify Screen Recording permission is enabled');
    console.log('  4. Run this script again');
    process.exit(1);
  } else {
    console.log('ℹ️  Current window is not Chrome');
    console.log('   Switch to Chrome and run this again');
    process.exit(1);
  }
})();
" 2>&1

