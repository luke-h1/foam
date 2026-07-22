export interface SyncMeasureOptions {
  runs?: number;
  warmupRuns?: number;
}

export interface SyncMeasureResult {
  meanMs: number;
  medianMs: number;
  minMs: number;
  maxMs: number;
  runs: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) {
    return 0;
  }
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

export function measureSync(
  fn: () => void,
  options: SyncMeasureOptions = {},
): SyncMeasureResult {
  const runs = options.runs ?? 5;
  const warmupRuns = options.warmupRuns ?? 1;

  for (let i = 0; i < warmupRuns; i += 1) {
    fn();
  }

  const times: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  const sorted = times.toSorted((a, b) => a - b);
  const sum = times.reduce((acc, value) => acc + value, 0);

  return {
    meanMs: round2(sum / times.length),
    medianMs: round2(median(sorted)),
    minMs: round2(sorted[0] ?? 0),
    maxMs: round2(sorted[sorted.length - 1] ?? 0),
    runs: times.length,
  };
}
