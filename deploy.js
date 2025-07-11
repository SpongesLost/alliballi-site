#!/usr/bin/env node
// deploy.js - Deployment script to auto-update service worker

const fs = require('fs');
const path = require('path');

function updateServiceWorker() {
  const swPath = path.join(__dirname, 'service-worker.js');
  const htmlPath = path.join(__dirname, 'index.html');
  
  // Read service worker file
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Update build time
  const now = new Date().toISOString();
  swContent = swContent.replace(
    /const BUILD_TIME = ".*?";/, 
    `const BUILD_TIME = "${now}";`
  );
  
  // Extract current version number and increment
  const versionMatch = swContent.match(/const CACHE_NAME = "pwa-cache-v(\d+)";/);
  if (versionMatch) {
    const currentVersion = parseInt(versionMatch[1]);
    const newVersion = currentVersion + 1;
    swContent = swContent.replace(
      /const CACHE_NAME = "pwa-cache-v\d+";/,
      `const CACHE_NAME = "pwa-cache-v${newVersion}";`
    );
  }
  
  // Write updated service worker
  fs.writeFileSync(swPath, swContent);
  
  // Update sw-update.js version in HTML
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const versionParamMatch = htmlContent.match(/sw-update\.js\?v=(\d+)/);
  if (versionParamMatch) {
    const currentSwVersion = parseInt(versionParamMatch[1]);
    const newSwVersion = currentSwVersion + 1;
    htmlContent = htmlContent.replace(
      /sw-update\.js\?v=\d+/,
      `sw-update.js?v=${newSwVersion}`
    );
  }
  
  // Write updated HTML
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log('✅ Service worker updated successfully!');
  console.log('📦 Cache version bumped');
  console.log('🔄 sw-update.js version bumped');
  console.log('🕐 Build time updated to:', now);
}

updateServiceWorker();
