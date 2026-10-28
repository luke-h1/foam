#!/usr/bin/env node
// Adapted from expo-module-scripts (MIT License, Copyright (c) 2015-present
// 650 Industries, Inc. (aka Expo)) via davidmokos/expo-crack. It opens the
// app's generated native project, because the local modules have no example app.
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

if (process.platform !== 'darwin') {
  console.error(
    `Error: Xcode is only available on macOS. Cannot open the iOS project on ${process.platform}.`,
  );
  process.exit(1);
}

const projectPath = path.join(__dirname, '..', '..', 'ios');

if (!fs.existsSync(projectPath)) {
  console.error(
    `Error: ${projectPath} does not exist. Run \`bun run prebuild:ios\` first.`,
  );
  process.exit(1);
}
const child = spawn('xed', [projectPath], { stdio: 'inherit' });

child.once('error', error => {
  console.error(`Error: Failed to open Xcode: ${error.message}`);
  process.exit(1);
});
