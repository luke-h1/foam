import { useCallback, useRef } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';

import { useMountedRef } from './useMountedRef';
import { useUnmountCallback } from './useUnmountCallback';

export type UseDebouncedCallbackReturn<Args extends unknown[]> = [
  (...args: Args) => Promise<void>,
  () => void,
];

/**
 * Debounce `callback` so it only runs after `timeout` ms have passed.
 * Running it again resets the timer and swaps in the new arguments.
 */
export function useDebouncedCallback<Args extends unknown[] = []>(
  callback: (...args: Args) => void,
  timeout = 0,
): UseDebouncedCallbackReturn<Args> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const callbackRef = useSyncRef(callback);
  const mountedRef = useMountedRef();

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
