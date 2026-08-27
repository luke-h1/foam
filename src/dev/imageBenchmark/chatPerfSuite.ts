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
}

export const WARMUP_MS = 5000;

/**
 * Flood-off gap so decoded-image memory / GC settles; back-to-back raid phases can OOM the simulator.
 */
export const COOLDOWN_MS = 4000;

/**
 * Total visible time ≈ (WARMUP + measure + COOLDOWN) × phases.
 */
export const SUITE_PHASES: SuitePhase[] = [
  { preset: 'raid', measureMs: 15000 },
  { preset: 'steady60', measureMs: 15000 },
];

export const SUITE_TOTAL_MS = SUITE_PHASES.reduce(
  (sum, p) => sum + WARMUP_MS + p.measureMs + COOLDOWN_MS,
  0,
);
