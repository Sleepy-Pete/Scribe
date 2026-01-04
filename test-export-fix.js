#!/usr/bin/env node

/**
 * Test script to verify the export fix for 2025-01-02
 */

const fs = require('fs');
const path = require('path');

// Import the obsidian module
const obsidianPath = path.join(__dirname, 'apps/api/src/obsidian.ts');

console.log('Testing export fix for 2025-01-02...\n');

// Check if personal note exists
const vaultPath = '/Users/Peter/Petros';
const personalNotePath = path.join(vaultPath, '20250102 - My Notes.md');

console.log('1. Checking for personal note...');
if (fs.existsSync(personalNotePath)) {
  console.log('   ✓ Found personal note:', personalNotePath);
  const content = fs.readFileSync(personalNotePath, 'utf-8');
  console.log('   Content preview:', content.substring(0, 100) + '...\n');
} else {
  console.log('   ✗ Personal note not found\n');
}

// Check export file
const exportPath = path.join(vaultPath, 'Scribe Tracker', '20260102 - Export.md');
console.log('2. Checking current export file...');
if (fs.existsSync(exportPath)) {
  console.log('   ✓ Found export:', exportPath);
  const content = fs.readFileSync(exportPath, 'utf-8');
  
  // Check for sections
  const hasPersonalNotes = content.includes('## Personal Notes');
  const hasTimeline = content.includes('### Timeline') || content.includes('## Timeline');
  const hasStats = content.includes('### Stats') || content.includes('## Stats');
  const hasTopApps = content.includes('### Top Apps') || content.includes('## Top Apps');
  
  console.log('   Sections found:');
  console.log('   - Personal Notes:', hasPersonalNotes ? '✓' : '✗');
  console.log('   - Stats:', hasStats ? '✓' : '✗');
  console.log('   - Top Apps:', hasTopApps ? '✓' : '✗');
  console.log('   - Timeline:', hasTimeline ? '✓' : '✗');
  
  if (!hasTimeline) {
    console.log('\n   ⚠️  Timeline is MISSING - this is the bug!');
  }
  if (!hasPersonalNotes) {
    console.log('   ⚠️  Personal Notes not merged');
  }
} else {
  console.log('   ✗ Export file not found\n');
}

console.log('\n3. Next steps:');
console.log('   - Restart the API server to pick up the code changes');
console.log('   - Re-export 2025-01-02 to test the fix');
console.log('   - Command: curl -X POST http://localhost:3001/api/export/obsidian -H "Content-Type: application/json" -d \'{"date":"2025-01-02"}\'');

