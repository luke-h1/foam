/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
const fs = require('fs');
const semver = require('semver');
const childProcess = require('child_process');

// ANSI escape codes for red text and reset
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

/**
 * checks that current node and npm versions satisfies requirements in package.json
 * to run manually: node check-version.js [verbose]
 * adapted from https://stackoverflow.com/a/72397817
 */
const VERBOSE_FORCED = false;
const args = process.argv.slice(2);
const VERBOSE = VERBOSE_FORCED || (args.length > 0 && args[0] === 'verbose');

const printErrAndExit = error => {
  console.error(`${RED}${error}${RESET}`);
  console.error(`${RED}Aborting${RESET}`);
  process.exit(1);
};

const checkPackageManagerVersion = versionRequired => {
  if (!versionRequired) {
    printErrAndExit('No required bun version specified');
    return;
  }

  const bunVersion = `${childProcess.execSync('bun -v')}`.trim();
  if (VERBOSE) {
    console.log(
      `bun required: '${versionRequired}' - current: '${bunVersion}'`,
    );
  }

  if (!semver.satisfies(bunVersion, versionRequired)) {
    printErrAndExit(
      `Required bun version '${versionRequired}' not satisfied. Current: '${bunVersion}'. Please install ${versionRequired}`,
    );
  }
};

const checkNodeVersion = nodeVersionRequired => {
  if (!nodeVersionRequired) {
    console.log('No required node version specified');
    return;
  }
  const nodeVersion = process.version;

  if (VERBOSE) {
    console.log(
      `node required: '${nodeVersionRequired}' - current: '${nodeVersion}'`,
    );
  }

  if (!semver.satisfies(nodeVersion, nodeVersionRequired)) {
    printErrAndExit(
      `Required node version '${nodeVersionRequired}' not satisfied. Current: '${nodeVersion}'. Please install ${nodeVersionRequired}`,
    );
  }
};

const pkg = JSON.parse(fs.readFileSync('./package.json'));

if (!pkg.engines) {
  printErrAndExit('No engines entry in package.json?');
}

checkNodeVersion(pkg.engines.node);
checkPackageManagerVersion(pkg.engines.bun);
