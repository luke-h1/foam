/**
 * Prints the Flashlight overall score for a results file, without opening the
 * web report.
 *
 * The formula copies the one in the Flashlight reporter:
 *   score = average(cpuScore, fpsScore) * (1 - highCpuPenalty)
 * cpuScore = clamp(-0.31666666666667 * cpu + 116, 0, 100) and
 * fpsScore = 100 * fps / 60. The penalty is the share of the window in which
 * any thread was above 90% CPU.
 *
 * The web report is the source of truth. Use this script to read a number in
 * the terminal.
 *
 *   bun scripts/bench/score.ts bench-results/top-streams.json
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const POLLING_INTERVAL_MS = 500;
const HIGH_CPU_THRESHOLD = 90;

interface Measure {
  cpu: { perName: Record<string, number> };
  fps?: number;
  ram?: number;
}

interface Iteration {
  status?: string;
  measures: Measure[];
}

interface FlashlightResult {
  status?: string;
  iterations: Iteration[];
}

interface Score {
  score: number;
  fps: number;
  cpu: number;
  ram: number;
  penalty: number;
  iterations: number;
  failed: number;
}

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

const cpuScore = (cpu: number) =>
  Math.min(Math.max(0, -0.31666666666667 * cpu + 116), 100);

function averageMeasures(iterations: Iteration[]): Measure[] {
  const length = Math.min(...iterations.map(i => i.measures.length));

  return Array.from({ length }, (_, index) => {
    const slot = iterations.map(i => i.measures[index]!);
    const perName: Record<string, number> = {};

    for (const measure of slot) {
      for (const [name, value] of Object.entries(measure.cpu.perName)) {
        perName[name] = (perName[name] ?? 0) + value / slot.length;
      }
    }

    return {
      cpu: { perName },
      fps: sum(slot.map(m => m.fps ?? 0)) / slot.length,
      ram: sum(slot.map(m => m.ram ?? 0)) / slot.length,
    };
  });
}

function highCpuMs(measures: Measure[]): number {
  const values = measures.flatMap(m => Object.values(m.cpu.perName));

  return (
    values.filter(v => v > HIGH_CPU_THRESHOLD).length * POLLING_INTERVAL_MS
  );
}

function totalCpu(measures: Measure[]): number {
  const values = measures.flatMap(m => Object.values(m.cpu.perName));

  return sum(values) / measures.length;
}

function scoreOf(result: FlashlightResult): Score | null {
  const iterations = result.iterations.filter(
    i => i.status === 'SUCCESS' || !i.status,
  );

  if (
    iterations.length === 0 ||
    iterations.some(i => i.measures.length === 0)
  ) {
    return null;
  }

  const measures = averageMeasures(iterations);
  const penaltyMs =
    sum(iterations.map(i => highCpuMs(i.measures))) / iterations.length;
  const fps = sum(measures.map(m => m.fps ?? 0)) / measures.length;
  const cpu = totalCpu(measures);
  const penalty = penaltyMs / (measures.length * POLLING_INTERVAL_MS);

  return {
    score: Math.round(
      Math.max(0, ((cpuScore(cpu) + (100 * fps) / 60) / 2) * (1 - penalty)),
    ),
    fps: Number(fps.toFixed(1)),
    cpu: Number(cpu.toFixed(1)),
    ram: Math.round(sum(measures.map(m => m.ram ?? 0)) / measures.length),
    penalty: Number(penalty.toFixed(3)),
    iterations: iterations.length,
    failed: result.iterations.length - iterations.length,
  };
}

function formatScore(name: string, s: Score): string {
  const failed = s.failed ? `, ${s.failed} failed` : '';

  return (
    `${name.padEnd(30)} score ${String(s.score).padStart(3)}` +
    `   fps ${String(s.fps).padStart(4)}   cpu ${String(s.cpu).padStart(5)}%` +
    `   ram ${String(s.ram).padStart(4)}MB   penalty ${s.penalty}` +
    `   (${s.iterations} iterations${failed})`
  );
}

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('usage: bun scripts/bench/score.ts <results.json> [...]');
  process.exit(1);
}

for (const file of files) {
  const result = JSON.parse(readFileSync(file, 'utf8')) as FlashlightResult;
  const score = scoreOf(result);
  const name = basename(file);

  console.log(
    score
      ? formatScore(name, score)
      : `${name.padEnd(30)} no successful iteration with measures ` +
          `(status ${result.status}, ${result.iterations.length} iterations)`,
  );
}
