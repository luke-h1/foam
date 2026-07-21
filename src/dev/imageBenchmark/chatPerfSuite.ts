// DEV-ONLY: deterministic Chat Perf suite definition. Each phase pins a flood
// preset; the fixture replay is restarted at each measure window
// (resetFloodReplay) so each run feeds a byte-identical message stream.

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
   * UI-thread frame health (Reanimated useFrameCallback) - the real rendering
   * smoothness, vs the JS-thread fps/jank above which is inflated by the flood
   * timer + Metro. uiJankPerSec is the metric that actually answers "no jank".
   */
  uiFpsAvg: number;
  uiJankPerSec: number;
}

export const WARMUP_MS = 5000;

/**
 * Flood-off gap between phases so decoded-image memory / GC can settle; without
 * it, back-to-back raid phases grow RSS unbounded and can OOM on the simulator.
 */
export const COOLDOWN_MS = 4000;

/**
 * Two intensities. Lower fps / higher jank = worse. Total visible time ≈
 * (WARMUP + measure + COOLDOWN) × phases.
 */
export const SUITE_PHASES: SuitePhase[] = [
  { preset: 'raid', measureMs: 15000 },
  { preset: 'steady60', measureMs: 15000 },
];

export const SUITE_TOTAL_MS = SUITE_PHASES.reduce(
  (sum, p) => sum + WARMUP_MS + p.measureMs + COOLDOWN_MS,
  0,
);
