// Deep test of Chrome window detection
const activeWin = require('active-win');

console.log('🔍 Deep Chrome Window Analysis\n');
console.log('Make sure Chrome is the active window, then press Enter to continue...');

process.stdin.once('data', async () => {
  try {
    console.log('\n📊 Fetching window information...\n');
    
    const window = await activeWin();
    
    if (!window) {
      console.log('❌ No active window detected!');
      process.exit(1);
    }
    
    console.log('='.repeat(60));
    console.log('FULL WINDOW OBJECT');
    console.log('='.repeat(60));
    console.log(JSON.stringify(window, null, 2));
    console.log('');
    
    console.log('='.repeat(60));
    console.log('DETAILED ANALYSIS');
    console.log('='.repeat(60));
    
    const { owner, title, id, bounds, url, memoryUsage, platform } = window;
    
    console.log(`\n📱 Platform: ${platform}`);
    console.log(`\n🪟 Window ID: ${id}`);
    console.log(`\n📐 Bounds:`);
    console.log(`   x: ${bounds?.x}, y: ${bounds?.y}`);
    console.log(`   width: ${bounds?.width}, height: ${bounds?.height}`);
    
    console.log(`\n🏢 Owner (App):`);
    console.log(`   Name: "${owner.name}"`);
    console.log(`   Process ID: ${owner.processId}`);
    console.log(`   Bundle ID: ${owner.bundleId || 'N/A'}`);
    console.log(`   Path: ${owner.path || 'N/A'}`);
    
    console.log(`\n📝 Window Title:`);
    console.log(`   Value: "${title}"`);
    console.log(`   Type: ${typeof title}`);
    console.log(`   Length: ${title ? title.length : 0}`);
    console.log(`   Is Empty: ${!title || title.trim() === ''}`);
    console.log(`   Bytes: ${Buffer.from(title || '').length}`);
    
    if (url) {
      console.log(`\n🌐 URL: ${url}`);
    } else {
      console.log(`\n🌐 URL: Not available (requires Accessibility permission)`);
    }
    
    if (memoryUsage) {
      console.log(`\n💾 Memory Usage: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS');
    console.log('='.repeat(60) + '\n');
    
    const isChrome = owner.name.toLowerCase().includes('chrome');
    const hasTitle = title && title.trim() !== '';
    
    if (isChrome && !hasTitle) {
      console.log('❌ PROBLEM CONFIRMED: Chrome has empty window title\n');
      console.log('Possible causes:');
      console.log('  1. Chrome is on a special internal page:');
      console.log('     - chrome://settings');
      console.log('     - chrome://extensions');
      console.log('     - chrome://newtab');
      console.log('     - about:blank');
      console.log('     - chrome://flags');
      console.log('');
      console.log('  2. Chrome window is in a special state:');
      console.log('     - Minimized');
      console.log('     - Hidden');
      console.log('     - Background tab with no title');
      console.log('');
      console.log('  3. macOS-specific issue:');
      console.log('     - Chrome may not expose titles for certain pages');
      console.log('     - Security/privacy restriction');
      console.log('');
      console.log('🔧 TO FIX:');
      console.log('  1. Navigate Chrome to a regular website:');
      console.log('     - https://google.com');
      console.log('     - https://youtube.com');
      console.log('     - https://github.com');
      console.log('  2. Make sure the tab is active (not a background tab)');
      console.log('  3. Run this test again');
      console.log('');
    } else if (isChrome && hasTitle) {
      console.log('✅ SUCCESS: Chrome window title is being captured!');
      console.log(`   Title: "${title}"`);
    } else if (!isChrome) {
      console.log(`ℹ️  Active window is ${owner.name}, not Chrome`);
      if (hasTitle) {
        console.log(`✅ Window title is available: "${title}"`);
      } else {
        console.log(`❌ Window title is empty for ${owner.name} too!`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});

