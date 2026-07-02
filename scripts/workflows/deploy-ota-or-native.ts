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
import {
  getCommandErrorMessage,
  getRequiredArg,
  runTool,
  writeGithubOutput,
  type ToolRunner,
} from './github-actions';
import {
  createAwsCopier,
  requireBucketName,
  restoreEntries,
  saveEntries,
  type S3Copier,
} from './s3Cache';
import { isVariant } from './variant';

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

function awsCopier(): S3Copier {
  return createAwsCopier(getAwsEnv());
}

const PLATFORMS = ['ios', 'android'] as const;

function restoreFingerprintCacheCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const branch = getRequiredArg(args, 'branch');
  const variant = getRequiredArg(args, 'variant');
  const fallbackBranch = getRequiredArg(args, 'fallback-branch', 'main');

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });

  const copier = awsCopier();

  const restore = (cacheBranch: string): number => {
    const prefix = getFingerprintCachePrefix({
      bucket,
      branch: cacheBranch,
      variant,
    });

    return restoreEntries(
      copier,
      PLATFORMS.map(platform => ({
        remote: `${prefix}/${platform}`,
        local: join(cacheDir, platform),
      })),
    );
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

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(join(cacheDir, 'ios'), `${currentIos}\n`, 'utf8');
  writeFileSync(join(cacheDir, 'android'), `${currentAndroid}\n`, 'utf8');

  const prefix = getFingerprintCachePrefix({ bucket, branch, variant });

  saveEntries(
    awsCopier(),
    PLATFORMS.map(platform => ({
      local: join(cacheDir, platform),
      remote: `${prefix}/${platform}`,
    })),
  );

  console.log(`💾 Saved fingerprints to S3 for ${branch}/${variant} 🚀`);
}

function restoreCriticalOtaIndexCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const variant = getRequiredArg(args, 'variant');

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });

  const restored = restoreEntries(awsCopier(), [
    {
      remote: getCriticalOtaIndexCachePath({ bucket, variant }),
      local: join(cacheDir, 'index'),
    },
  ]);

  if (restored > 0) {
    console.log(`📂 Restored critical OTA index from S3 for ${variant}`);
    return;
  }

  console.log(`ℹ️ No S3 critical OTA index found for ${variant}`);
}

function saveCriticalOtaIndexCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const variant = getRequiredArg(args, 'variant');

  requireBucketName(bucket);

  saveEntries(awsCopier(), [
    {
      local: join(cacheDir, 'index'),
      remote: getCriticalOtaIndexCachePath({ bucket, variant }),
    },
  ]);

  console.log(`💾 Saved critical OTA index to S3 for ${variant}`);
}

function restoreOtaUpdateIdsCommand(args: string[]): void {
  const cacheDir = getRequiredArg(args, 'cache-dir');
  const bucket = getRequiredArg(args, 'bucket');
  const variant = getRequiredArg(args, 'variant');

  requireBucketName(bucket);
  mkdirSync(cacheDir, { recursive: true });

  const prefix = getOtaUpdateIdsCachePrefix({ bucket, variant });

  const restored = restoreEntries(
    awsCopier(),
    PLATFORMS.map(platform => ({
      remote: `${prefix}/${platform}`,
      local: join(cacheDir, platform),
    })),
  );

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

  requireBucketName(bucket);

  const prefix = getOtaUpdateIdsCachePrefix({ bucket, variant });

  saveEntries(
    awsCopier(),
    PLATFORMS.map(platform => ({
      local: join(cacheDir, platform),
      remote: `${prefix}/${platform}`,
    })),
    { onMissing: 'skip' },
  );

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
    'auto' | 'ota' | 'build';

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

function publishOtaCommand(args: string[], run: ToolRunner = runTool): void {
  const platform = getRequiredArg(args, 'platform', 'ios');
  const variant = getRequiredArg(args, 'variant', 'production');
  const message = getRequiredArg(args, 'message');

  if (!isVariant(variant)) {
    throw new Error(`Unsupported variant: ${variant}`);
  }

  const platformArgs =
    platform === 'all' ? ['--platform', 'all'] : ['--platform', platform];

  let updateOutput = '[]';

  try {
    updateOutput = run(
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
        env: Object.fromEntries(
          Object.entries({
            ...process.env,
            EXPO_PUBLIC_APP_VARIANT: variant,
          }).map(([key, value]) => [key, value == null ? '' : String(value)]),
        ) as NodeJS.ProcessEnv,
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
