/**
 * Compare two semantic versions
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
export function compareVersions(
  version1: string,
  version2: string,
): -1 | 0 | 1 {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const v1Part = v1Parts[i] ?? 0;
    const v2Part = v2Parts[i] ?? 0;

    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }

  return 0;
}

/**
 * Check if the current version is below the minimum required version
 * @param currentVersion - The app's current version
 * @param minimumVersion - The minimum required version from remote config
 * @returns true if an update is required (current < minimum)
 */
export function isUpdateRequired(
  currentVersion: string | null | undefined,
  minimumVersion: string | null | undefined,
): boolean {
  if (!currentVersion || !minimumVersion) {
    return false;
  }

  return compareVersions(currentVersion, minimumVersion) === -1;
}
