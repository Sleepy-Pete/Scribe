// Test Chrome window title detection
const activeWin = require('active-win');

console.log('🔍 Testing Chrome window title detection...');
console.log('👉 Please switch to Chrome now and wait...\n');

let attempts = 0;
const maxAttempts = 10;

const interval = setInterval(async () => {
  attempts++;
  
  try {
    const window = await activeWin();
    
    if (!window) {
      console.log(`[${attempts}] No active window detected`);
      return;
    }
    
    const { owner, title } = window;
    const appName = owner.name;
    
    console.log(`[${attempts}] App: ${appName}`);
    console.log(`[${attempts}] Title: "${title}"`);
    console.log(`[${attempts}] Title length: ${title ? title.length : 0}`);
    
    if (appName.toLowerCase().includes('chrome')) {
      console.log('\n✅ Chrome detected!');
      console.log(`   Window title: "${title}"`);
      
      if (!title || title.trim() === '') {
        console.log('\n❌ ERROR: Chrome window title is EMPTY!');
        console.log('   This should not happen if Screen Recording permission is granted.');
        console.log('\n   Possible causes:');
        console.log('   1. Chrome is on a special page (chrome://, about:, etc.)');
        console.log('   2. Permission was granted but terminal needs restart');
        console.log('   3. Chrome needs to be restarted');
      } else {
        console.log('\n✅ SUCCESS: Chrome window title is being captured!');
      }
      
      clearInterval(interval);
      process.exit(0);
    }
    
    if (attempts >= maxAttempts) {
      console.log('\n⏱️  Timeout: Chrome not detected in 10 seconds');
      clearInterval(interval);
      process.exit(1);
    }
  } catch (error) {
    console.error(`[${attempts}] Error:`, error.message);
  }
}, 1000);

