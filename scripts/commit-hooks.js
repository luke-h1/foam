const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function main() {
  try {
    // await execAsync('node ./scripts/check-semver.js');
    await execAsync('node ./scripts/generate-licenses.js');
  } catch (error) {
    process.exit(1);
  }
}

main();
