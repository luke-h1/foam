import { Image as ExpoImage } from 'expo-image';

import type { PassResult } from './benchResults';

// Decoded references are retained in this bag during a run so host-side memory
// sampling captures peak decoded-bitmap footprint. Cleared between passes.
let retained: unknown[] = [];

export function clearRetained(): void {
  retained = [];
}

// Downloads every image to expo-image's disk cache so the timed passes measure
// decode (not network), making cold fair and order-independent.
export async function prewarm(urls: string[]): Promise<void> {
  await ExpoImage.prefetch(urls, 'disk').catch(() => undefined);
  clearRetained();
}

export async function resetMemoryCache(): Promise<void> {
  await ExpoImage.clearMemoryCache().catch(() => undefined);
  clearRetained();
}

async function decodeOne(url: string): Promise<void> {
  const ref = await ExpoImage.loadAsync(url);
  retained.push(ref);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx] ?? 0;
}

function summarise(
  pass: 'cold' | 'warm',
  mode: 'sequential' | 'concurrent',
  durations: number[],
  fail: number,
  totalMs: number,
): PassResult {
  // eslint-disable-next-line react-doctor/js-tosorted-immutable -- Hermes lacks Array.prototype.toSorted (throws "undefined is not a function"); copy-then-sort is the safe equivalent
  const sorted = [...durations].sort((a, b) => a - b);
  const sum = durations.reduce((acc, d) => acc + d, 0);
  return {
    pass,
    mode,
    count: durations.length + fail,
    ok: durations.length,
    fail,
    totalMs: Math.round(totalMs),
    meanMs: durations.length
      ? Math.round((sum / durations.length) * 100) / 100
      : 0,
    p50Ms: Math.round(percentile(sorted, 50) * 100) / 100,
    p95Ms: Math.round(percentile(sorted, 95) * 100) / 100,
    minMs: Math.round((sorted[0] ?? 0) * 100) / 100,
    maxMs: Math.round((sorted[sorted.length - 1] ?? 0) * 100) / 100,
  };
}

export async function runSequential(
  pass: 'cold' | 'warm',
  urls: string[],
  onProgress?: (done: number) => void,
): Promise<PassResult> {
  const durations: number[] = [];
  let fail = 0;
  const start = performance.now();
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    if (!url) {
      continue;
    }
    const t0 = performance.now();
    try {
      // eslint-disable-next-line react-doctor/async-await-in-loop -- sequential is the measurement: one decode at a time, timed individually
      await decodeOne(url);
      durations.push(performance.now() - t0);
    } catch {
      fail += 1;
    }
    if (onProgress && i % 50 === 0) {
      onProgress(i + 1);
    }
  }
  const totalMs = performance.now() - start;
  return summarise(pass, 'sequential', durations, fail, totalMs);
}

// Fires all decodes with bounded concurrency to mimic a busy-chat burst and
// measure wall-clock throughput of the decode pipeline under contention.
export async function runConcurrent(
  urls: string[],
  concurrency = 16,
): Promise<PassResult> {
  const workerCount = Math.max(1, Math.floor(concurrency));
  const durations: number[] = [];
  let fail = 0;
  let cursor = 0;
  const start = performance.now();

  async function worker(): Promise<void> {
    for (;;) {
      const i = cursor;
      cursor += 1;
      const url = urls[i];
      if (i >= urls.length || !url) {
        return;
      }
      const t0 = performance.now();
      try {
        // eslint-disable-next-line react-doctor/async-await-in-loop -- each worker drains the shared queue serially; concurrency comes from running N workers
        await decodeOne(url);
        durations.push(performance.now() - t0);
      } catch {
        fail += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  const totalMs = performance.now() - start;
  return summarise('warm', 'concurrent', durations, fail, totalMs);
}
