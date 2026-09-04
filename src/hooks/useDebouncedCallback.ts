import { useCallback, useEffect, useRef } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

import { useUnmountCallback } from './useUnmountCallback';

export type UseDebouncedCallbackReturn<Args extends unknown[]> = [
  (...args: Args) => Promise<void>,
  () => void,
];

export function useDebouncedCallback<Args extends unknown[] = []>(
  callback: (...args: Args) => void,
  timeout = 0,
): UseDebouncedCallbackReturn<Args> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const callbackRef = useSyncRef(callback);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  });

  const run = async (...args: Args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return new Promise<void>(resolve => {
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          callbackRef.current(...args);
          timeoutRef.current = undefined;
        }
        resolve();
      }, timeout);
    });
  };

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  useUnmountCallback(cancel);

  return [run, cancel];
}
