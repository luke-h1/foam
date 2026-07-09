import { existsSync } from 'node:fs';

import {
  buildSentrySizeAnalysisUploadArgs,
  SENTRY_SIZE_ANALYSIS_DEFAULT_ORG,
  SENTRY_SIZE_ANALYSIS_DEFAULT_PROJECT,
} from './sentrySizeAnalysis';
import { getRequiredArg, runTool } from './github-actions';

function upload(args: string[]): void {
  const artifactPath = getRequiredArg(args, 'path');
  const variant = getRequiredArg(args, 'variant');

  if (!existsSync(artifactPath)) {
    throw new Error(`Size Analysis artifact does not exist: ${artifactPath}`);
  }

  const org = process.env.SENTRY_ORG ?? SENTRY_SIZE_ANALYSIS_DEFAULT_ORG;
  const project =
    process.env.SENTRY_PROJECT ?? SENTRY_SIZE_ANALYSIS_DEFAULT_PROJECT;
  const authToken = process.env.SENTRY_AUTH_TOKEN;

  if (authToken == null || authToken === '') {
    throw new Error('SENTRY_AUTH_TOKEN is not set');
  }

  const sentryCli =
    process.env.SENTRY_CLI_BIN ?? './node_modules/.bin/sentry-cli';

  const uploadArgs = buildSentrySizeAnalysisUploadArgs({
    artifactPath,
    variant,
    org,
    project,
  });

  runTool(sentryCli, uploadArgs, {
    env: {
      ...process.env,
      SENTRY_AUTH_TOKEN: authToken,
      SENTRY_LOAD_DOTENV: '0',
      SENTRY_URL: process.env.SENTRY_URL ?? 'https://sentry.io/',
    },
    stdio: 'inherit',
  });
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'upload':
      upload(args);
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
