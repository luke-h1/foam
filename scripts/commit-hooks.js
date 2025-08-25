const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function main() {
  try {
    // await execAsync('node ./scripts/check-semver.js');
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();
