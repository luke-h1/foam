export function parseCurrentRolloutPercentage(
  viewOutput: string,
): string | null {
  const match = viewOutput.match(/^\s*Rollout Percentage\s+(\d+)%\s*$/m);
  return match?.[1] ?? null;
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
