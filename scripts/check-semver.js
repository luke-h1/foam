const fs = require('fs');
const semver = require('semver');
const childProcess = require('child_process');

/**
 * Checks that the current node and bun versions satisfy `engines` in
 * package.json.
 *
 * Run with: node scripts/check-semver.js [verbose]
 * Adapted from https://stackoverflow.com/a/72397817
 */
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const VERBOSE = process.argv[2] === 'verbose';

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
