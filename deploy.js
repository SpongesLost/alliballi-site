#!/usr/bin/env node
// deploy.js - Deployment script to auto-update service worker

const fs = require('fs');
const path = require('path');

const serviceWorkerPath = path.join(__dirname, 'service-worker.js');
const buildTime = new Date().toISOString();

// Read service worker file
let content = fs.readFileSync(serviceWorkerPath, 'utf8');

// Update build timestamp
content = content.replace(
  /const BUILD_TIME = ".*";/,
  `const BUILD_TIME = "${buildTime}";`
);

// Extract current cache version and increment it
const versionMatch = content.match(/const CACHE_NAME = "pwa-cache-v(\d+)";/);
if (versionMatch) {
  const currentVersion = parseInt(versionMatch[1]);
  const newVersion = currentVersion + 1;
  content = content.replace(
    /const CACHE_NAME = "pwa-cache-v\d+";/,
    `const CACHE_NAME = "pwa-cache-v${newVersion}";`
  );
  console.log(`✅ Updated cache version from v${currentVersion} to v${newVersion}`);
}

// Update sw-update.js version in index.html
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');
const swVersionMatch = indexContent.match(/sw-update\.js\?v=(\d+)/);
if (swVersionMatch) {
  const currentSwVersion = parseInt(swVersionMatch[1]);
  const newSwVersion = currentSwVersion + 1;
  indexContent = indexContent.replace(
    /sw-update\.js\?v=\d+/,
    `sw-update.js?v=${newSwVersion}`
  );
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✅ Updated sw-update.js version from v${currentSwVersion} to v${newSwVersion}`);
}

// Write updated service worker
fs.writeFileSync(serviceWorkerPath, content);

console.log(`✅ Updated build timestamp to: ${buildTime}`);
console.log('🚀 Ready for deployment!');
