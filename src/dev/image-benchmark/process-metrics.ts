import CpuUsage from '@modules/cpu-usage/src/CpuUsageModule';

export interface ProcessMetricsSample {
  t: number;
  memMb: number;
  cpu: number;
}

const SAMPLE_MS = 1000;

let latest: ProcessMetricsSample = { t: 0, memMb: 0, cpu: 0 };
let timer: ReturnType<typeof setInterval> | null = null;
let retainers = 0;
const listeners = new Set<(sample: ProcessMetricsSample) => void>();

function readNativeSample(): ProcessMetricsSample {
  const memRaw = CpuUsage.getUsedMemoryMb();
  const memMb = Number.isFinite(memRaw) && memRaw > 0 ? Math.round(memRaw) : 0;
  const cpuRaw = CpuUsage.getUsage();

  return {
    t: Date.now(),
    memMb,
    cpu: Number.isFinite(cpuRaw) ? Math.round(cpuRaw) : 0,
  };
}

function publish(sample: ProcessMetricsSample) {
  latest = sample;

  for (const listener of listeners) {
    listener(sample);
  }
}

function tick() {
  publish(readNativeSample());
}

export function retainProcessMetricsPolling(
  onSample?: (sample: ProcessMetricsSample) => void,
): () => void {
  if (onSample) {
    listeners.add(onSample);
  }

  retainers += 1;

  if (!timer) {
    tick();
    timer = setInterval(tick, SAMPLE_MS);
  }

  return () => {
    if (onSample) {
      listeners.delete(onSample);
    }

    retainers -= 1;

    if (retainers === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function peekProcessMetrics(): ProcessMetricsSample {
  return latest;
}

export function sampleProcessMetricsNow(): ProcessMetricsSample {
  if (!timer) {
    tick();
  }

  return latest;
}
