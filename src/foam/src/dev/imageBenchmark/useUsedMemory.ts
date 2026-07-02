// DEV-ONLY: polls the app's resident memory (RSS) once a second for the Chat
// Perf overlay. Decoded image bitmaps live in native memory (SDWebImage), not
// the JS heap, so `performance.memory` wouldn't see them — DeviceInfo's
// getUsedMemory reads the process's actual footprint, which is what climbs when
// the image cache is unbounded.
import { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';

export function useUsedMemoryMb(): number {
  const [mb, setMb] = useState(0);
  useEffect(() => {
    let active = true;
    const sample = async () => {
      try {
        const bytes = await DeviceInfo.getUsedMemory();
        if (active && typeof bytes === 'number') {
          setMb(Math.round(bytes / (1024 * 1024)));
        }
      } catch {
        // getUsedMemory can reject on some platforms; leave the last reading.
      }
    };
    void sample();
    const id = setInterval(sample, 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);
  return mb;
}
