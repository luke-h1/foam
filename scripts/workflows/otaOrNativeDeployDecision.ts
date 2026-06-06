export type DeployType = 'ota' | 'build';
export type ManualDeployType = DeployType | 'auto';

export type Fingerprints = {
  ios: string | null;
  android: string | null;
};

type PublishedUpdate = {
  id?: string;
  group?: string;
  platform?: string;
};

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

export function getPreliminaryReleaseTag(
  version: string,
  deployType: DeployType,
): string {
  return deployType === 'ota' ? 'ota-pending' : version;
}

export function getFinalReleaseTag(input: {
  deployType: DeployType;
  version: string;
  runNumber: number;
}): string {
  if (input.deployType !== 'ota') {
    return input.version;
  }

  return `ota-${input.version}-${input.runNumber}`;
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
