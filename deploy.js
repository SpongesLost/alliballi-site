#!/usr/bin/env node
// deploy.js - Deployment script to auto-update service worker

const fs = require('fs');
const path = require('path');

function updateServiceWorker() {
  const swPath = path.join(__dirname, 'service-worker.js');
  const htmlPath = path.join(__dirname, 'index.html');
  
  try {
    // Read service worker file
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Extract current CACHE_VERSION and increment it
    const versionMatch = swContent.match(/const CACHE_VERSION = (\d+);/);
    if (versionMatch) {
      const currentVersion = parseInt(versionMatch[1]);
      const newVersion = currentVersion + 1;
      
      // Update CACHE_VERSION
      swContent = swContent.replace(
        /const CACHE_VERSION = \d+;/,
        `const CACHE_VERSION = ${newVersion};`
      );
      
      console.log(`📦 Cache version updated: ${currentVersion} → ${newVersion}`);
    } else {
      console.warn('⚠️ Could not find CACHE_VERSION in service worker');
    }
    
    // Add a timestamp comment to ensure the file content changes
    const timestamp = new Date().toISOString();
    const timestampComment = `// Last updated: ${timestamp}`;
    
    // Remove old timestamp if exists and add new one at the top
    swContent = swContent.replace(/\/\/ Last updated: .*\n/, '');
    swContent = timestampComment + '\n' + swContent;
    
    // Write updated service worker
    fs.writeFileSync(swPath, swContent);
    console.log('✅ Service worker updated');
    
    // Update sw-update.js version in HTML if it exists
    if (fs.existsSync(htmlPath)) {
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Look for sw-update.js reference with version parameter
      const swUpdateMatch = htmlContent.match(/sw-update\.js\?v=(\d+)/);
      if (swUpdateMatch) {
        const currentSwVersion = parseInt(swUpdateMatch[1]);
        const newSwVersion = currentSwVersion + 1;
        htmlContent = htmlContent.replace(
          /sw-update\.js\?v=\d+/,
          `sw-update.js?v=${newSwVersion}`
        );
        
        // Write updated HTML
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`🔄 sw-update.js version updated: ${currentSwVersion} → ${newSwVersion}`);
      } else {
        console.log('ℹ️  No sw-update.js version parameter found in HTML');
      }
    } else {
      console.warn('⚠️  index.html not found');
    }
    
    console.log('🕐 Timestamp:', timestamp);
    console.log('🚀 Deployment update complete!');
    console.log('💡 Tip: Refresh your app to see changes');
    
  } catch (error) {
    console.error('❌ Error updating files:', error.message);
    process.exit(1);
  }
}

// Run the update
updateServiceWorker();
