import { useEffect, useState } from 'react';

import CpuUsage from '@modules/cpu-usage/src/CpuUsageModule';

function readUsage(): number | null {
  const value = CpuUsage.getUsage();
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

// Polls process CPU usage (summed across all threads, like `top`) once a
// second for the dev chat-perf overlay. iOS-only; returns 0 elsewhere.
export function useCpuUsage(): number {
  const [pct, setPct] = useState(() => readUsage() ?? 0);
  useEffect(() => {
    const id = setInterval(() => {
      const value = readUsage();
      if (value !== null) {
        setPct(value);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return pct;
}
