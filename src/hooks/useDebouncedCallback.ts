import { useRef, useCallback } from 'react';
import { useMountedRef } from './useMountedRef';
import { useUnmountCallback } from './useUnmountCallback';

export type UseDebouncedCallbackReturn<Args extends unknown[]> = [
  (...args: Args) => Promise<void>,
  () => void,
];

/**
 * Debounce a {@param callback} so that it will only run
 * after a specified {@param timeout} has passed (in milliseconds).
 *
 * If the debounced callback is run again, it will reset the
 * current timeout and start again with the new callback arguments.
 */
export function useDebouncedCallback<Args extends unknown[] = []>(
  callback: (...args: Args) => void,
  timeout = 0,
): UseDebouncedCallbackReturn<Args> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const callbackRef = useRef(callback);
  const mountedRef = useMountedRef();

  callbackRef.current = callback;

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
