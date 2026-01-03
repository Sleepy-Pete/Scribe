#!/bin/bash

echo "🔍 Checking Chrome window title using AppleScript..."
echo ""

# Get Chrome window title using AppleScript
chrome_title=$(osascript -e 'tell application "Google Chrome" to get title of active tab of front window' 2>&1)
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "✅ AppleScript successfully retrieved Chrome tab title:"
  echo "   Title: \"$chrome_title\""
  echo ""
  
  if [ -z "$chrome_title" ]; then
    echo "⚠️  Title is EMPTY!"
    echo "   Chrome may be on a special page or New Tab"
  else
    echo "✅ Title is available via AppleScript"
    echo "   This means Chrome HAS a title, but active-win isn't getting it"
  fi
else
  echo "❌ AppleScript failed to get Chrome title"
  echo "   Error: $chrome_title"
  echo ""
  echo "   Possible reasons:"
  echo "   - Chrome is not running"
  echo "   - Chrome has no windows open"
  echo "   - Accessibility permission not granted"
fi

echo ""
echo "---"
echo ""

# Now test with active-win
echo "🔍 Checking what active-win sees..."
echo ""

cd "$(dirname "$0")/.." || exit
node -e "
const activeWin = require('active-win');

(async () => {
  const window = await activeWin();
  
  if (!window) {
    console.log('❌ active-win: No window detected');
    return;
  }
  
  const isChrome = window.owner.name.toLowerCase().includes('chrome');
  
  if (isChrome) {
    console.log('✅ active-win detected Chrome');
    console.log('   App Name:', window.owner.name);
    console.log('   Window Title:', window.title ? '\"' + window.title + '\"' : '(empty)');
    console.log('   Title Length:', window.title ? window.title.length : 0);
    
    if (!window.title || window.title.trim() === '') {
      console.log('');
      console.log('❌ active-win is returning EMPTY title for Chrome!');
      console.log('   But AppleScript got: \"$chrome_title\"');
      console.log('');
      console.log('   This indicates a Screen Recording permission issue.');
    }
  } else {
    console.log('ℹ️  active-win detected:', window.owner.name);
    console.log('   (Not Chrome - switch to Chrome and run again)');
  }
})();
" 2>&1

echo ""

