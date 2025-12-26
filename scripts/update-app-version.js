#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const appConfigPath = path.resolve(__dirname, '../app.config.ts');

// Read the version from package.json (updated by release-it)
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;

// Read app.config.ts
let appConfigContent = fs.readFileSync(appConfigPath, 'utf8');

// Update the VERSION constant
// Match: const VERSION = '0.0.34';
const versionRegex = /const VERSION = ['"]([\d.]+)['"];?/;
if (versionRegex.test(appConfigContent)) {
  const oldVersion = appConfigContent.match(versionRegex)?.[1];
  appConfigContent = appConfigContent.replace(
    versionRegex,
    `const VERSION = '${newVersion}';`,
  );
  fs.writeFileSync(appConfigPath, appConfigContent, 'utf8');
  console.log(
    `✅ Updated VERSION in app.config.ts from ${oldVersion} to ${newVersion}`,
  );
} else {
  console.error('❌ Could not find VERSION constant in app.config.ts');
  process.exit(1);
}
