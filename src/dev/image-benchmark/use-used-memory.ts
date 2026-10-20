import { useEffect, useState } from 'react';

import CpuUsage from '@modules/cpu-usage/src/CpuUsageModule';

function readUsedMemoryMb(): number | null {
  const mb = CpuUsage.getUsedMemoryMb();
  return Number.isFinite(mb) && mb > 0 ? Math.round(mb) : null;
}

export function useUsedMemoryMb(): number {
  const [mb, setMb] = useState(() => readUsedMemoryMb() ?? 0);

  useEffect(() => {
    const id = setInterval(() => {
      const value = readUsedMemoryMb();
      if (value !== null) {
        setMb(value);
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return mb;
}
