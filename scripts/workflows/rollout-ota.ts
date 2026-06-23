import {
  parseCurrentRolloutPercentage,
  validateTargetPercentage,
} from './otaRolloutPercentage';
import {
  getCommandErrorMessage,
  getRequiredArg,
  runTool,
  writeGithubOutput,
  type ToolRunner,
} from './github-actions';

function fetchCurrentCommand(args: string[], run: ToolRunner = runTool): void {
  const otaId = getRequiredArg(args, 'ota-id');
  let viewOutput = '';

  try {
    viewOutput = run('eas', ['update:view', otaId]);
  } catch (error) {
    throw new Error(
      `Failed to view update group. Make sure ota_id is an update group ID. ${getCommandErrorMessage(
        error,
      )}`,
    );
  }

  console.log(`::group::eas update:view output (${otaId})`);
  console.log(viewOutput);
  console.log('::endgroup::');

  const currentRollout = parseCurrentRolloutPercentage(viewOutput);

  if (currentRollout == null) {
    console.log(
      '::warning::No rollout percentage was found in eas update:view output. This update group likely is not a rollout update.',
    );
    writeGithubOutput('is_rollout', 'false');
    writeGithubOutput('current_rollout', '');
    return;
  }

  writeGithubOutput('is_rollout', 'true');
  writeGithubOutput('current_rollout', currentRollout);
  console.log(`Current rollout: ${currentRollout}%`);
}

function progressCommand(args: string[], run: ToolRunner = runTool): void {
  const otaId = getRequiredArg(args, 'ota-id');
  const target = validateTargetPercentage(getRequiredArg(args, 'target'));
  const current = Number.parseInt(getRequiredArg(args, 'current'), 10);

  if (target < current) {
    console.log(
      `::warning::Target rollout (${target}%) is lower than the current rollout (${current}%). Proceeding anyway.`,
    );
  }

  console.log(`Setting rollout for ${otaId} to ${target}%...`);
  try {
    run(
      'eas',
      [
        'update:edit',
        otaId,
        '--rollout-percentage',
        String(target),
        '--non-interactive',
      ],
      { stdio: 'inherit' },
    );
  } catch (error) {
    throw new Error(
      `Failed to progress rollout. ${getCommandErrorMessage(error)}`,
    );
  }
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'fetch-current':
      fetchCurrentCommand(args);
      return;
    case 'progress':
      progressCommand(args);
      return;
    default:
      throw new Error(`Unknown command: ${command ?? '<missing>'}`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`::error::${message}`);
  process.exit(1);
}
