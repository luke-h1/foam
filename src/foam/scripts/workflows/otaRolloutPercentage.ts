export function parseCurrentRolloutPercentage(
  viewOutput: string,
): string | null {
  for (const line of viewOutput.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('Rollout Percentage')) {
      continue;
    }

    const value = trimmed.slice('Rollout Percentage'.length).trim();
    if (!value.endsWith('%')) {
      continue;
    }

    const percentage = value.slice(0, -1).trim();
    if (/^\d+$/.test(percentage)) {
      return percentage;
    }
  }

  return null;
}

export function validateTargetPercentage(target: string): number {
  if (!/^\d+$/.test(target)) {
    throw new Error('target_percentage must be an integer between 1 and 100.');
  }

  const parsed = Number.parseInt(target, 10);

  if (parsed < 1 || parsed > 100) {
    throw new Error('target_percentage must be an integer between 1 and 100.');
  }

  return parsed;
}
