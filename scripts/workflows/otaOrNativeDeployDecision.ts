import { appendVariant, getVariantMeta } from './variant';

export type DeployType = 'ota' | 'build';
export type ManualDeployType = DeployType | 'auto';

export type Fingerprints = {
  ios: string | null;
  android: string | null;
};

export type FingerprintCacheInput = {
  bucket: string;
  branch: string;
  variant: string;
};

type PublishedUpdate = {
  id?: string;
  group?: string;
  platform?: string;
};

export function getFingerprintCachePrefix(
  input: FingerprintCacheInput,
): string {
  const baseUri = `s3://${input.bucket}`;
  const branch = encodeURIComponent(input.branch);
  const variant = encodeURIComponent(input.variant);

  return `${baseUri}/fingerprints/${branch}/${variant}`;
}

export function getCriticalOtaIndexCachePath(input: {
  bucket: string;
  variant: string;
}): string {
  const baseUri = `s3://${input.bucket}`;
  const variant = encodeURIComponent(input.variant);

  return `${baseUri}/ota-critical-index/${variant}/index`;
}

export function getOtaUpdateIdsCachePrefix(input: {
  bucket: string;
  variant: string;
}): string {
  const baseUri = `s3://${input.bucket}`;
  const variant = encodeURIComponent(input.variant);

  return `${baseUri}/ota-update-ids/${variant}`;
}

export function compareFingerprints(
  previous: Fingerprints,
  current: Fingerprints,
): boolean {
  if (previous.ios == null || previous.android == null) {
    return true;
  }

  return previous.ios !== current.ios || previous.android !== current.android;
}

export function decideDeployType(
  manualType: ManualDeployType,
  fingerprintChanged: boolean,
): DeployType {
  if (manualType === 'ota') {
    return 'ota';
  }

  if (manualType === 'build') {
    return 'build';
  }

  return fingerprintChanged ? 'build' : 'ota';
}

/**
 * Tag marking the commit an OTA update was published from, e.g.
 * `ota-production-1.0.1-457`. The run number is monotonic per workflow, so the
 * highest-numbered `ota-<variant>-<version>-*` tag is the latest OTA live on
 * that channel for that version - which is the commit a hotfix must branch from
 * (see scripts/hotfix.sh). The EAS update group id is not in the name (it goes
 * in the tag's annotation) so the tag stays sortable and changelog-friendly.
 */
export function getOtaReleaseTag(input: {
  variant: string;
  version: string;
  runNumber: number;
}): string {
  getVariantMeta(input.variant);

  return `ota-${input.variant}-${input.version}-${input.runNumber}`;
}

export function getPreliminaryReleaseTag(
  version: string,
  deployType: DeployType,
  variant = 'production',
): string {
  return deployType === 'ota' ? 'ota-pending' : appendVariant(version, variant);
}

export function getFinalReleaseTag(input: {
  deployType: DeployType;
  variant: string;
  version: string;
  runNumber: number;
}): string {
  if (input.deployType === 'ota') {
    return getOtaReleaseTag({
      variant: input.variant,
      version: input.version,
      runNumber: input.runNumber,
    });
  }

  return appendVariant(input.version, input.variant);
}

export function parsePublishedUpdateJson(updateJson: string): {
  iosUpdateId: string;
  androidUpdateId: string;
  updateGroupId: string;
} {
  let updates: PublishedUpdate[] = [];

  try {
    const parsed = JSON.parse(updateJson) as unknown;

    if (Array.isArray(parsed)) {
      updates = parsed as PublishedUpdate[];
    }
  } catch {
    return {
      iosUpdateId: '',
      androidUpdateId: '',
      updateGroupId: '',
    };
  }

  const iosUpdate = updates.find(update => update.platform === 'ios');
  const androidUpdate = updates.find(update => update.platform === 'android');

  return {
    iosUpdateId: iosUpdate?.id ?? '',
    androidUpdateId: androidUpdate?.id ?? '',
    updateGroupId: updates[0]?.group ?? '',
  };
}
