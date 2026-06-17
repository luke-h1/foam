// DEV-ONLY: persists benchmark results to Documents/img-bench.json so they can
// be read off the simulator data container from the host shell.
import { File, Paths } from 'expo-file-system';

const RESULTS_FILENAME = 'img-bench.json';

export interface PassResult {
  pass: 'cold' | 'warm';
  mode: 'sequential' | 'concurrent';
  count: number;
  ok: number;
  fail: number;
  totalMs: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
}

export interface PhaseMarker {
  phase: string;
  t: number;
}

export interface BenchFile {
  workload: string;
  startedAt: number;
  runs: PassResult[];
  phases: PhaseMarker[];
  frames: unknown[];
}

function resultsFile(): File {
  return new File(Paths.document, RESULTS_FILENAME);
}

export function readResults(): BenchFile {
  const file = resultsFile();
  if (!file.exists) {
    return {
      workload: 'cinna-2x-avif',
      startedAt: Date.now(),
      runs: [],
      phases: [],
      frames: [],
    };
  }
  try {
    return JSON.parse(file.textSync()) as BenchFile;
  } catch {
    return {
      workload: 'cinna-2x-avif',
      startedAt: Date.now(),
      runs: [],
      phases: [],
      frames: [],
    };
  }
}

function writeResults(data: BenchFile): void {
  const file = resultsFile();
  if (!file.exists) {
    file.create({ overwrite: true });
  }
  file.write(JSON.stringify(data, null, 2));
}

export function appendRun(run: PassResult): void {
  const data = readResults();
  data.runs.push(run);
  writeResults(data);
}

export function markPhase(phase: string): void {
  const data = readResults();
  data.phases.push({ phase, t: Date.now() });
  writeResults(data);
}

export function appendFrames(entry: unknown): void {
  const data = readResults();
  data.frames.push(entry);
  writeResults(data);
}

export function resetResults(): void {
  writeResults({
    workload: 'cinna-2x-avif',
    startedAt: Date.now(),
    runs: [],
    phases: [],
    frames: [],
  });
}
