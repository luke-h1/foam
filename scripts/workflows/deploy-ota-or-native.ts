import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  compareFingerprints,
  decideDeployType,
  getCriticalOtaIndexCachePath,
  getFingerprintCachePrefix,
  getFinalReleaseTag,
  getOtaUpdateIdsCachePrefix,
  getPreliminaryReleaseTag,
  parsePublishedUpdateJson,
} from './otaOrNativeDeployDecision';
import { getRequiredArg, writeGithubOutput } from './github-actions';

function getCommandErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown command failure';
  }

  const commandError = error as Error & {
    stderr?: string | Buffer | null;
  };
  const stderr =
    typeof commandError.stderr === 'string'
      ? commandError.stderr.trim()
      : commandError.stderr?.toString().trim();

  return stderr === '' || stderr == null ? error.message : stderr;
}

function readFingerprint(
  cacheDir: string,
  platform: 'ios' | 'android',
): string | null {
  const path = join(cacheDir, platform);

  if (!existsSync(path)) {
    return null;
  }

  return readFileSync(path, 'utf8').trim();
}

function requireBucketName(value: string): void {
  if (value === '' || value.startsWith('s3://') || value.includes('/')) {
    throw new Error(`Expected an S3 bucket name, received: ${value}`);
  }
}

function getAwsEnv(): NodeJS.ProcessEnv {
  const accessKeyId = process.env.FOAM_AWS_FINGERPRINT_ACCESS_KEY_ID;
  const secretAccessKey = process.env.FOAM_AWS_FINGERPRINT_SECRET_KEY;

  if (accessKeyId == null || accessKeyId === '') {
    throw new Error('FOAM_AWS_FINGERPRINT_ACCESS_KEY_ID is not set');
  }

  if (secretAccessKey == null || secretAccessKey === '') {
    throw new Error('FOAM_AWS_FINGERPRINT_SECRET_KEY is not set');
  }

  const env = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => [
      key,
      value == null ? '' : String(value),
    ]),
  ) as NodeJS.ProcessEnv;

  env.AWS_ACCESS_KEY_ID = accessKeyId;
  env.AWS_SECRET_ACCESS_KEY = secretAccessKey;

  const region =
    process.env.FOAM_AWS_REGION == null || process.env.FOAM_AWS_REGION === ''
      ? 'eu-west-2'
      : process.env.FOAM_AWS_REGION;

  env.AWS_REGION = region;
  env.AWS_DEFAULT_REGION = region;

  console.log('AWS env ready 🚀');

  return env;
}

function copyFromS3(source: string, target: string): boolean {
  try {
    execFileSync('aws', ['s3', 'cp', source, target, '--only-show-errors'], {
      encoding: 'utf8',
      env: getAwsEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

function copyToS3(source: string, target: string): void {
  execFileSync('aws', ['s3', 'cp', source, target, '--only-show-errors'], {
    encoding: 'utf8',
    env: getAwsEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function restoreFingerprintCacheCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const branch = getRequiredArg(args, 'branch');
  const variant = getRequiredArg(args, 'variant');
  const fallbackBranch = getRequiredArg(args, 'fallback-branch', 'main');

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });

  const restore = (cacheBranch: string): number => {
    const prefix = getFingerprintCachePrefix({
      bucket,
      branch: cacheBranch,
      variant,
    });

    let restored = 0;

    for (const platform of ['ios', 'android'] as const) {
      const restoredPlatform = copyFromS3(
        `${prefix}/${platform}`,
        join(cacheDir, platform),
      );

      if (restoredPlatform) {
        restored += 1;
      }
    }

    return restored;
  };

  const restoredFromBranch = restore(branch);

  if (restoredFromBranch > 0) {
    console.log(
      `📂 Restored ${restoredFromBranch} fingerprint(s) from S3 for ${branch}/${variant} 🚀`,
    );
    return;
  }

  if (fallbackBranch !== branch) {
    const restoredFromFallback = restore(fallbackBranch);

    if (restoredFromFallback > 0) {
      console.log(
        `📂 Restored ${restoredFromFallback} fingerprint(s) from S3 for ${fallbackBranch}/${variant} 🚀`,
      );
      return;
    }
  }

  console.log(`ℹ️ No S3 fingerprint cache found for ${branch}/${variant} ⚠️`);
}

function saveFingerprintCacheCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const branch = getRequiredArg(args, 'branch');
  const variant = getRequiredArg(args, 'variant');
  const currentIos = getRequiredArg(args, 'current-ios');
  const currentAndroid = getRequiredArg(args, 'current-android');
  const prefix = getFingerprintCachePrefix({
    bucket,
    branch,
    variant,
  });

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(join(cacheDir, 'ios'), `${currentIos}\n`, 'utf8');
  writeFileSync(join(cacheDir, 'android'), `${currentAndroid}\n`, 'utf8');

  copyToS3(join(cacheDir, 'ios'), `${prefix}/ios`);
  copyToS3(join(cacheDir, 'android'), `${prefix}/android`);

  console.log(`💾 Saved fingerprints to S3 for ${branch}/${variant} 🚀`);
}

function restoreCriticalOtaIndexCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const variant = getRequiredArg(args, 'variant');
  const cachePath = getCriticalOtaIndexCachePath({ bucket, variant });
  const targetPath = join(cacheDir, 'index');

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });

  if (copyFromS3(cachePath, targetPath)) {
    console.log(`📂 Restored critical OTA index from S3 for ${variant}`);
    return;
  }

  console.log(`ℹ️ No S3 critical OTA index found for ${variant}`);
}

function saveCriticalOtaIndexCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const variant = getRequiredArg(args, 'variant');
  const cachePath = getCriticalOtaIndexCachePath({ bucket, variant });
  const sourcePath = join(cacheDir, 'index');

  requireBucketName(bucket);

  if (!existsSync(sourcePath)) {
    throw new Error(`Critical OTA index file does not exist: ${sourcePath}`);
  }

  copyToS3(sourcePath, cachePath);

  console.log(`💾 Saved critical OTA index to S3 for ${variant}`);
}

function restoreOtaUpdateIdsCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const variant = getRequiredArg(args, 'variant');
  const prefix = getOtaUpdateIdsCachePrefix({ bucket, variant });

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });

  let restored = 0;

  for (const platform of ['ios', 'android'] as const) {
    const restoredPlatform = copyFromS3(
      `${prefix}/${platform}`,
      join(cacheDir, platform),
    );

    if (restoredPlatform) {
      restored += 1;
    }
  }

  if (restored > 0) {
    console.log(
      `📂 Restored ${restored} OTA update ID(s) from S3 for ${variant}`,
    );
    return;
  }

  console.log(`ℹ️ No S3 OTA update IDs found for ${variant}`);
}

function saveOtaUpdateIdsCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const variant = getRequiredArg(args, 'variant');
  const prefix = getOtaUpdateIdsCachePrefix({ bucket, variant });

  requireBucketName(bucket);

  for (const platform of ['ios', 'android'] as const) {
    const sourcePath = join(cacheDir, platform);

    if (existsSync(sourcePath)) {
      copyToS3(sourcePath, `${prefix}/${platform}`);
    }
  }

  console.log(`💾 Saved OTA update IDs to S3 for ${variant}`);
}

function compareFingerprintsCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const currentIos = getRequiredArg(args, 'current-ios');
  const currentAndroid = getRequiredArg(args, 'current-android');
  const previous = {
    ios: readFingerprint(cacheDir, 'ios'),
    android: readFingerprint(cacheDir, 'android'),
  };
  const current = {
    ios: currentIos,
    android: currentAndroid,
  };
  const changed = compareFingerprints(previous, current);

  if (previous.ios == null) {
    console.log('ℹ️ No previous iOS fingerprint found (first run)');
  } else if (previous.ios === current.ios) {
    console.log('✅ iOS fingerprint unchanged');
  } else {
    console.log(`⚠️ iOS fingerprint changed: ${previous.ios} → ${current.ios}`);
  }

  if (previous.android == null) {
    console.log('ℹ️ No previous Android fingerprint found (first run)');
  } else if (previous.android === current.android) {
    console.log('✅ Android fingerprint unchanged');
  } else {
    console.log(
      `⚠️ Android fingerprint changed: ${previous.android} → ${current.android}`,
    );
  }

  writeGithubOutput('changed', String(changed));
}

function decideDeployTypeCommand(args: string[]): void {
  const manualType = getRequiredArg(args, 'manual-type', 'auto') as
    | 'auto'
    | 'ota'
    | 'build';

  const fingerprintChanged =
    getRequiredArg(args, 'fingerprint-changed', 'false') === 'true';
  const deployType = decideDeployType(manualType, fingerprintChanged);

  if (manualType === 'ota') {
    console.log('📦 Manual: OTA update requested');
  } else if (manualType === 'build') {
    console.log('🔨 Manual: Native build requested');
  } else if (deployType === 'build') {
    console.log('🔨 Auto: Native changes detected - build required');
  } else {
    console.log('📦 Auto: No native changes - OTA update');
  }

  writeGithubOutput('deploy-type', deployType);
}

function preliminaryTagCommand(args: string[]): void {
  const version = getRequiredArg(args, 'version');
  const deployType = getRequiredArg(args, 'deploy-type') as 'ota' | 'build';
  const variant = getRequiredArg(args, 'variant', 'production');
  const tag = getPreliminaryReleaseTag(version, deployType, variant);

  if (deployType === 'ota') {
    console.log('🏷️ OTA release - no git tag will be created');
  }

  if (deployType === 'build') {
    console.log(`🏷️ Native release tag: ${tag}`);
  }

  writeGithubOutput('tag', tag);
}

function publishOtaCommand(args: string[]): void {
  const platform = getRequiredArg(args, 'platform', 'ios');
  const variant = getRequiredArg(args, 'variant', 'production');
  const message = getRequiredArg(args, 'message');
  if (!['production', 'internal', 'testflight'].includes(variant)) {
    throw new Error(`Unsupported variant: ${variant}`);
  }
  const platformArgs =
    platform === 'all' ? ['--platform', 'all'] : ['--platform', platform];

  let updateOutput = '[]';

  try {
    updateOutput = execFileSync(
      'eas',
      [
        'update',
        '--channel',
        variant,
        '--message',
        message,
        ...platformArgs,
        '--non-interactive',
        '--clear-cache',
        '--json',
      ],
      {
        encoding: 'utf8',
        env: Object.fromEntries(
          Object.entries({
            ...process.env,
            EXPO_PUBLIC_APP_VARIANT: variant,
          }).map(([key, value]) => [key, value == null ? '' : String(value)]),
        ) as NodeJS.ProcessEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch (error) {
    throw new Error(
      `Failed to publish OTA update. ${getCommandErrorMessage(error)}`,
    );
  }

  const parsed = parsePublishedUpdateJson(updateOutput);

  writeGithubOutput('ios_update_id', parsed.iosUpdateId);
  writeGithubOutput('android_update_id', parsed.androidUpdateId);
  writeGithubOutput('update_group_id', parsed.updateGroupId);

  console.log('📦 Published OTA Update:');
  console.log(`  iOS Update ID: ${parsed.iosUpdateId}`);
  console.log(`  Android Update ID: ${parsed.androidUpdateId}`);
  console.log(`  Update Group ID: ${parsed.updateGroupId}`);
}

function finalTagCommand(args: string[]): void {
  const tag = getFinalReleaseTag({
    deployType: getRequiredArg(args, 'deploy-type') as 'ota' | 'build',
    variant: getRequiredArg(args, 'variant', 'production'),
    version: getRequiredArg(args, 'version'),
    runNumber: Number.parseInt(getRequiredArg(args, 'run-number'), 10),
  });

  console.log(`🏷️ Release tag: ${tag}`);
  writeGithubOutput('tag', tag);
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'restore-fingerprint-cache':
      restoreFingerprintCacheCommand(args);
      return;
    case 'save-fingerprint-cache':
      saveFingerprintCacheCommand(args);
      return;
    case 'restore-critical-ota-index':
      restoreCriticalOtaIndexCommand(args);
      return;
    case 'save-critical-ota-index':
      saveCriticalOtaIndexCommand(args);
      return;
    case 'restore-ota-update-ids':
      restoreOtaUpdateIdsCommand(args);
      return;
    case 'save-ota-update-ids':
      saveOtaUpdateIdsCommand(args);
      return;
    case 'compare-fingerprints':
      compareFingerprintsCommand(args);
      return;
    case 'decide-deploy-type':
      decideDeployTypeCommand(args);
      return;
    case 'preliminary-tag':
      preliminaryTagCommand(args);
      return;
    case 'publish-ota':
      publishOtaCommand(args);
      return;
    case 'final-tag':
      finalTagCommand(args);
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
