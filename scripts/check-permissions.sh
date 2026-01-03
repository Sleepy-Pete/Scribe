#!/bin/bash

# Check Screen Recording Permission for macOS
# This script tests if the current terminal has screen recording permission

echo "🔍 Checking Screen Recording Permission..."
echo ""

# Try to get the active window title using a simple Node.js script
node -e "
const activeWin = require('active-win');

(async () => {
  try {
    const window = await activeWin();
    
    if (!window) {
      console.log('❌ Could not detect active window');
      process.exit(1);
    }
    
    const { owner, title } = window;
    
    console.log('✅ Active Window Detection Working!');
    console.log('');
    console.log('Current Window:');
    console.log('  App:', owner.name);
    console.log('  Title:', title || '(empty)');
    console.log('');
    
    if (!title || title.trim() === '') {
      console.log('⚠️  WARNING: Window title is EMPTY!');
      console.log('');
      console.log('This means Screen Recording permission is NOT granted.');
      console.log('');
      console.log('🔧 To fix:');
      console.log('  1. Open System Settings (or System Preferences)');
      console.log('  2. Go to Privacy & Security > Screen Recording');
      console.log('  3. Enable permission for your Terminal app');
      console.log('  4. Restart this script');
      console.log('');
      process.exit(1);
    } else {
      console.log('✅ Screen Recording permission is GRANTED!');
      console.log('   Window titles are being captured correctly.');
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
" 2>&1

exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "✅ All permissions are working correctly!"
else
  echo ""
  echo "❌ Permission check failed (exit code: $exit_code)"
fi

exit $exit_code

