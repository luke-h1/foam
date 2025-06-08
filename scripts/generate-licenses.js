const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function isWorkingTreeDirty() {
  try {
    const { stdout } = await execAsync('git status --porcelain bun.lock');
    return stdout.trim().length > 0;
  } catch (error) {
    console.error('Error checking git status:', error);
    return false;
  }
}

async function main() {
  try {
    const isDirty = await isWorkingTreeDirty();

    if (!isDirty) {
      return;
    }
    await execAsync('rm -f assets/licenses.json');
    await execAsync('bun run generate-licenses');
    await execAsync('bun run prettier --write assets/licenses.json');

    console.info('Done!');
  } catch (error) {
    process.exit(1);
  }
}

main();
