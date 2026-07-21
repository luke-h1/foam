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
