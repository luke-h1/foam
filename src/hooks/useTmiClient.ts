import { useMemo } from 'react';
import tmijs from 'tmi.js';

export function useTmiClient(options: tmijs.Options) {
  const tmiClient = useMemo(() => {
    return new tmijs.Client({
      ...options,
      options: {
        debug: __DEV__,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return tmiClient;
}
