import { useRef } from 'react';
import tmijs from 'tmi.js';

export function useTmiClient(options: tmijs.Options) {
  const clientRef = useRef<tmijs.Client | null>(null);

  if (!clientRef.current) {
    clientRef.current = new tmijs.Client({
      ...options,
      options: {
        debug: __DEV__,
        skipUpdatingEmotesets: true,
      },
    });
  }

  return clientRef.current;
}
