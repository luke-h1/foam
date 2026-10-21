import { useEffect, useState } from 'react';

import {
  peekProcessMetrics,
  retainProcessMetricsPolling,
} from './process-metrics';

export function useCpuUsage(): number {
  const [pct, setPct] = useState(() => peekProcessMetrics().cpu);

  useEffect(
    () =>
      retainProcessMetricsPolling(sample => {
        setPct(sample.cpu);
      }),
    [],
  );

  return pct;
}
