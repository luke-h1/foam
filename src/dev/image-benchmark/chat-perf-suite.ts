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
  uiFpsAvg: number;
  uiJankPerSec: number;
  memStartMb: number;
  memEndMb: number;
  memPeakMb: number;
  memDeltaMb: number;
  cpuAvg: number;
  cpuPeak: number;
}

export const WARMUP_MS = 5000;

export const COOLDOWN_MS = 10_000;

export const SUITE_PHASES: SuitePhase[] = [
  { preset: 'medium', measureMs: 50_000 },
  { preset: 'heavy', measureMs: 50_000 },
];

export const SUITE_TOTAL_MS =
  WARMUP_MS +
  SUITE_PHASES[0]!.measureMs +
  COOLDOWN_MS +
  WARMUP_MS +
  SUITE_PHASES[1]!.measureMs;
