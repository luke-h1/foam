import { appendVariant } from './variant';

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

export function parseManualDeployType(value: string): ManualDeployType {
  if (value === 'auto' || value === 'ota' || value === 'build') {
    return value;
  }
  throw new Error(`Unsupported manual deploy type: ${value}`);
}

export function parseDeployType(value: string): DeployType {
  if (value === 'ota' || value === 'build') {
    return value;
  }
  throw new Error(`Unsupported deploy type: ${value}`);
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
    return 'ota-pending';
  }

  return appendVariant(input.version, input.variant);
}

export function parsePublishedUpdateJson(updateJson: string) {
  let updates: PublishedUpdate[] = [];

  try {
    // SAFETY: JSON.parse returns `any`; narrowing to `unknown` first forces
    // the Array.isArray check below before the value is used for anything.
    const parsed = JSON.parse(updateJson) as unknown;

    if (Array.isArray(parsed)) {
      // SAFETY: `eas update --json` emits an array of update records shaped
      // like PublishedUpdate; every field this module reads off an entry is
      // optional, so an unexpected element shape degrades to `undefined`
      // rather than throwing.
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
