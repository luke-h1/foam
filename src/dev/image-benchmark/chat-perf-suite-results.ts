// DEV-ONLY: persists suite results to Documents/chat-perf-suite.json so adb / simctl can pull them after a run.
import { File, Paths } from 'expo-file-system';

import type { PhaseResult } from './chat-perf-suite';
import {
  type ProcessMetricsSample,
  sampleProcessMetricsNow,
} from './process-metrics';

export type { ProcessMetricsSample } from './process-metrics';

const RESULTS_FILENAME = 'chat-perf-suite.json';

export interface ChatPerfSuiteFile {
  startedAt: number;
  finishedAt: number | null;
  cancelled: boolean;
  phases: PhaseResult[];
  samples: ProcessMetricsSample[];
}

function resultsFile(): File {
  return new File(Paths.document, RESULTS_FILENAME);
}

function createEmptyResults(): ChatPerfSuiteFile {
  return {
    startedAt: Date.now(),
    finishedAt: null,
    cancelled: false,
    phases: [],
    samples: [],
  };
}

function writeResults(data: ChatPerfSuiteFile): void {
  const file = resultsFile();

  if (!file.exists) {
    file.create({ overwrite: true });
  }

  file.write(JSON.stringify(data, null, 2));
}

function readResults(): ChatPerfSuiteFile {
  const file = resultsFile();

  if (!file.exists) {
    return createEmptyResults();
  }

  try {
    // SAFETY: only written by writeResults from a ChatPerfSuiteFile.
    return JSON.parse(file.textSync()) as ChatPerfSuiteFile;
  } catch {
    return createEmptyResults();
  }
}

export function resetChatPerfSuiteResults(): void {
  writeResults(createEmptyResults());
}

export function recordChatPerfSuitePhase(
  phase: PhaseResult,
  samples: ProcessMetricsSample[],
): void {
  const data = readResults();
  data.phases.push(phase);
  data.samples.push(...samples);
  writeResults(data);
}

export function finishChatPerfSuiteResults(cancelled: boolean): void {
  const data = readResults();
  data.finishedAt = Date.now();
  data.cancelled = cancelled;
  writeResults(data);
}

export async function sampleProcessMetrics(): Promise<ProcessMetricsSample> {
  return sampleProcessMetricsNow();
}
