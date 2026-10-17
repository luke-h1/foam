// DEV-ONLY deterministic Chat Perf suite; each phase pins a flood preset and resetFloodReplay restarts the fixture so runs feed a byte-identical stream.

export interface SuitePhase {
  preset: string;
  measureMs: number;
}

export interface PhaseResult {
  preset: string;
  fpsAvg: number;
  fpsMin: number;
  fpsP10: number;
  jankPerSec: number;
  droppedPct: number;
  messages: number;
  /**
   * UI-thread frame health (Reanimated useFrameCallback); the JS fps/jank above is inflated by the flood timer + Metro, so uiJankPerSec is the metric that answers "no jank".
   */
  uiFpsAvg: number;
  uiJankPerSec: number;
  memStartMb: number;
  memEndMb: number;
  memPeakMb: number;
  memDeltaMb: number;
  cpuAvg: number;
  cpuPeak: number;
}

export const WARMUP_MS = 10_000;

/**
 * Flood-off gap so decoded-image memory / GC settles; back-to-back heavy phases can OOM the simulator.
 */
export const COOLDOWN_MS = 20_000;

/** medium then heavy; each measure window is 280s. */
export const SUITE_PHASES: SuitePhase[] = [
  { preset: 'medium', measureMs: 280_000 },
  { preset: 'heavy', measureMs: 280_000 },
];

/** Warmup + measure × 2 + cooldown between = 10 minutes. */
export const SUITE_TOTAL_MS =
  WARMUP_MS +
  SUITE_PHASES[0]!.measureMs +
  COOLDOWN_MS +
  WARMUP_MS +
  SUITE_PHASES[1]!.measureMs;
