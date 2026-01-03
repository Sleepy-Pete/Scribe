// Test window title detection for all applications
const activeWin = require('active-win');

console.log('🔍 Testing window title detection for all applications...\n');
console.log('This will poll every second for 30 seconds.');
console.log('Switch between different apps to see which ones return titles.\n');

let count = 0;
const maxCount = 30;
const seenApps = new Map();

const interval = setInterval(async () => {
  count++;
  
  try {
    const window = await activeWin();
    
    if (!window) {
      console.log(`[${count}] No active window detected`);
      return;
    }
    
    const { owner, title } = window;
    const appName = owner.name;
    const hasTitle = title && title.trim() !== '';
    
    // Track unique apps
    if (!seenApps.has(appName)) {
      seenApps.set(appName, {
        appName,
        hasTitle,
        exampleTitle: title,
        count: 1
      });
      
      const status = hasTitle ? '✅' : '❌';
      console.log(`${status} ${appName}`);
      console.log(`   Title: "${title}"`);
      console.log(`   Length: ${title ? title.length : 0} chars\n`);
    } else {
      const app = seenApps.get(appName);
      app.count++;
      
      // Update if we found a title when we didn't have one before
      if (!app.hasTitle && hasTitle) {
        app.hasTitle = true;
        app.exampleTitle = title;
        console.log(`✅ ${appName} (now has title!)`);
        console.log(`   Title: "${title}"\n`);
      }
    }
    
    if (count >= maxCount) {
      clearInterval(interval);
      
      console.log('\n' + '='.repeat(60));
      console.log('SUMMARY');
      console.log('='.repeat(60) + '\n');
      
      const appsWithTitles = [];
      const appsWithoutTitles = [];
      
      for (const [appName, data] of seenApps) {
        if (data.hasTitle) {
          appsWithTitles.push(data);
        } else {
          appsWithoutTitles.push(data);
        }
      }
      
      console.log(`✅ Apps WITH window titles (${appsWithTitles.length}):`);
      appsWithTitles.forEach(app => {
        console.log(`   - ${app.appName}`);
        console.log(`     Example: "${app.exampleTitle.substring(0, 50)}${app.exampleTitle.length > 50 ? '...' : ''}"`);
      });
      
      console.log(`\n❌ Apps WITHOUT window titles (${appsWithoutTitles.length}):`);
      appsWithoutTitles.forEach(app => {
        console.log(`   - ${app.appName}`);
        console.log(`     Detected ${app.count} times with empty title`);
      });
      
      if (appsWithoutTitles.some(app => app.appName.toLowerCase().includes('chrome'))) {
        console.log('\n⚠️  Chrome is returning empty titles!');
        console.log('   Possible reasons:');
        console.log('   1. Chrome is on a special page (chrome://, about:, etc.)');
        console.log('   2. Chrome is on a New Tab page');
        console.log('   3. Chrome window is minimized or hidden');
        console.log('   4. Chrome-specific permission issue');
        console.log('\n   Try opening a regular website (google.com, youtube.com) and run this again.');
      }
      
      process.exit(0);
    }
  } catch (error) {
    console.error(`[${count}] Error:`, error.message);
  }
}, 1000);

console.log('Polling started... switch between apps!\n');

