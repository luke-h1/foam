import { useMemo } from 'react';
import tmijs from 'tmi.js';

export default function useTmiClient(options: tmijs.Options) {
  const tmiClient = useMemo(() => {
    return new tmijs.Client({
      ...options,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return tmiClient;
}
