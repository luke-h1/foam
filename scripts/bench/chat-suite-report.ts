/**
 * Prints Flashlight + in-app suite metrics. Exits 1 on a leak signal or incomplete run.
 *
 *   bun scripts/bench/chat-suite-report.ts \
 *     bench-results/chat-suite.json \
 *     bench-results/chat-suite-app.json
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

export const POLLING_INTERVAL_MS = 500;

/** RSS growth above this MB/min is treated as a leak signal. */
export const LEAK_SLOPE_MB_PER_MIN = 8;

export interface FlashlightMeasure {
  cpu: { perName: Record<string, number> };
  fps?: number;
  ram?: number;
}

export interface RamDrift {
  startMb: number;
  endMb: number;
  peakMb: number;
  deltaMb: number;
  slopeMbPerMin: number;
  samples: number;
}

export function averageRam(measures: FlashlightMeasure[]): RamDrift | null {
  const rams = measures
    .map(m => m.ram)
    .filter((v): v is number => typeof v === 'number' && v > 0);

  if (rams.length < 2) {
    return null;
  }

  const startMb = rams[0]!;
  const endMb = rams[rams.length - 1]!;
  const durationMin = (rams.length * POLLING_INTERVAL_MS) / 60_000;
  const deltaMb = endMb - startMb;

  return {
    startMb: Math.round(startMb),
    endMb: Math.round(endMb),
    peakMb: Math.round(Math.max(...rams)),
    deltaMb: Math.round(deltaMb),
    slopeMbPerMin:
      durationMin > 0 ? Number((deltaMb / durationMin).toFixed(2)) : 0,
    samples: rams.length,
  };
}

export function isLeakSlope(drift: RamDrift): boolean {
  return drift.slopeMbPerMin >= LEAK_SLOPE_MB_PER_MIN;
}

export function meanFps(measures: FlashlightMeasure[]): number {
  const values = measures
    .map(m => m.fps)
    .filter((v): v is number => typeof v === 'number');

  if (values.length === 0) {
    return 0;
  }

  return Number(
    (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1),
  );
}

export function meanCpu(measures: FlashlightMeasure[]): number {
  const values = measures.flatMap(m => Object.values(m.cpu.perName));

  if (values.length === 0) {
    return 0;
  }

  return Number(
    (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1),
  );
}

interface FlashlightIteration {
  status?: string;
  measures: FlashlightMeasure[];
}

interface FlashlightResult {
  status?: string;
  iterations: FlashlightIteration[];
}

interface PhaseResult {
  preset: string;
  uiFpsAvg: number;
  uiJankPerSec: number;
  fpsAvg: number;
  jankPerSec: number;
  memStartMb: number;
  memEndMb: number;
  memPeakMb: number;
  memDeltaMb: number;
  cpuAvg: number;
  cpuPeak: number;
  messages: number;
}

interface AppSuiteFile {
  startedAt: number;
  finishedAt: number | null;
  cancelled: boolean;
  phases: PhaseResult[];
  samples: { t: number; memMb: number; cpu: number }[];
}

function reportFlashlight(file: string): void {
  const result = JSON.parse(readFileSync(file, 'utf8')) as FlashlightResult;
  const iterations = result.iterations.filter(
    i => i.status === 'SUCCESS' || !i.status,
  );

  if (iterations.length === 0) {
    console.log(
      `${basename(file)}  no successful Flashlight iteration (status ${result.status})`,
    );
    process.exitCode = 1;
    return;
  }

  const measures = iterations[0]!.measures;
  const drift = averageRam(measures);

  console.log(`Native (Flashlight) · ${basename(file)}`);
  console.log(
    `  fps ${meanFps(measures)}   cpu ${meanCpu(measures)}%   measures ${measures.length}   iterations ${iterations.length}`,
  );

  if (!drift) {
    console.log('  ram  (no samples)');
    return;
  }

  console.log(
    `  ram start ${drift.startMb}MB  end ${drift.endMb}MB  peak ${drift.peakMb}MB  Δ ${drift.deltaMb}MB`,
  );

  if (isLeakSlope(drift)) {
    console.log(
      `  LEAK SIGNAL  slope ${drift.slopeMbPerMin} MB/min ≥ ${LEAK_SLOPE_MB_PER_MIN}`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`  ram ok  slope ${drift.slopeMbPerMin} MB/min`);
}

function reportApp(file: string): void {
  const data = JSON.parse(readFileSync(file, 'utf8')) as AppSuiteFile;

  console.log(`React (in-app suite) · ${basename(file)}`);
  console.log(
    `  cancelled ${data.cancelled}   phases ${data.phases.length}   samples ${data.samples.length}`,
  );

  if (data.finishedAt && data.startedAt) {
    console.log(
      `  wall ${((data.finishedAt - data.startedAt) / 60_000).toFixed(1)}m`,
    );
  }

  for (const phase of data.phases) {
    const memSign = phase.memDeltaMb >= 0 ? '+' : '';
    console.log(
      `  ${phase.preset.padEnd(8)} ui-fps ${String(phase.uiFpsAvg).padStart(3)}` +
        `  ui-jank ${String(phase.uiJankPerSec).padStart(4)}/s` +
        `  js-fps ${String(phase.fpsAvg).padStart(3)}` +
        `  mem ${memSign}${phase.memDeltaMb}MB (peak ${phase.memPeakMb})` +
        `  cpu ${phase.cpuAvg}% (peak ${phase.cpuPeak})` +
        `  msgs ${phase.messages}`,
    );
  }

  if (data.cancelled || data.phases.length < 2) {
    process.exitCode = 1;
  }
}

function main(): void {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error(
      'usage: bun scripts/bench/chat-suite-report.ts <flashlight.json> [app-suite.json]',
    );
    process.exit(1);
  }

  const [flashlightFile, appFile] = files;

  if (flashlightFile) {
    try {
      reportFlashlight(flashlightFile);
    } catch (error) {
      process.exitCode = 1;
      console.error(`Flashlight unreadable: ${String(error)}`);
    }
  }

  if (appFile) {
    console.log('');
    try {
      reportApp(appFile);
    } catch (error) {
      process.exitCode = 1;
      console.error(`App suite unreadable: ${String(error)}`);
    }
  }
}

if (import.meta.main) {
  main();
}
