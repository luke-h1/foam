import { useEffect, useState } from 'react';

import {
  peekProcessMetrics,
  retainProcessMetricsPolling,
} from './process-metrics';

export function useUsedMemoryMb(): number {
  const [mb, setMb] = useState(() => peekProcessMetrics().memMb);

  useEffect(
    () =>
      retainProcessMetricsPolling(sample => {
        if (sample.memMb > 0) {
          setMb(sample.memMb);
        }
      }),
    [],
  );

  return mb;
}
