#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const appConfigPath = path.resolve(__dirname, '../app.config.ts');

// Read app.config.ts to get current version
const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
const versionRegex = /const VERSION = ['"]([\d.]+)['"];?/;
const match = appConfigContent.match(versionRegex);

if (!match) {
  console.error('❌ Could not find VERSION constant in app.config.ts');
  process.exit(1);
}

const currentVersion = match[1];

// Read and update package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (packageJson.version !== currentVersion) {
  packageJson.version = currentVersion;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `✅ Synced package.json version to ${currentVersion} from app.config.ts`,
  );
} else {
  console.log(`ℹ️  Versions already in sync: ${currentVersion}`);
}
