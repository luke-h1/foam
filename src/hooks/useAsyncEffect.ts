import {
  DependencyList,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useMountedRef } from './useMountedRef';

/**
 * A hook that allows running async effects with proper cleanup and error handling.
 * This is useful for async operations that need to be performed inside a `useEffect`
 *
 * @see https://github.com/streamich/react-use/blob/master/docs/useAsync.md
 * @see https://github.com/streamich/react-use/blob/master/src/useAsync.ts
 *
 * @param effect - The async effect function to execute.
 * @param dependencies - The dependencies of the effect.
 */
export function useAsyncEffect<T extends FunctionReturningPromise>(
  fn: T,
  deps: DependencyList = [],
) {
  const [state, callback] = useAsyncFn(fn, deps, {
    loading: true,
  });

  useEffect(() => {
    void callback();
  }, [callback]);

  return state;
}

function useAsyncFn<T extends FunctionReturningPromise>(
  fn: T,
  deps: DependencyList = [],
  initialState: StateFromFunctionReturningPromise<T> = { loading: false },
): AsyncFnReturn<T> {
  const lastCallId = useRef(0);
  const isMounted = useMountedRef();
  const [state, set] =
    useState<StateFromFunctionReturningPromise<T>>(initialState);

  const callback = useCallback((...args: Parameters<T>): ReturnType<T> => {
    // eslint-disable-next-line no-plusplus
    const callId = ++lastCallId.current;

    if (!state.loading) {
      set(prevState => ({ ...prevState, loading: true }));
    }

    return fn(...args).then(
      value => {
        if (isMounted.current && callId === lastCallId.current) {
          // @ts-expect-error - it's a library copied code
          set({ value, loading: false });
        }

        return value;
      },
      (error: unknown) => {
        if (isMounted.current && callId === lastCallId.current) {
          // @ts-expect-error - it's a library copied code
          set({ error, loading: false });
        }

        return error;
      },
    ) as ReturnType<T>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [state, callback as unknown as T];
}

type FunctionReturningPromise = (...args: unknown[]) => Promise<unknown>;

type PromiseType<P extends Promise<unknown>> =
  P extends Promise<infer T> ? T : never;

type AsyncState<T> =
  | {
      loading: boolean;
      error?: undefined;
      value?: undefined;
    }
  | {
      loading: true;
      error?: Error | undefined;
      value?: T;
    }
  | {
      loading: false;
      error: Error;
      value?: undefined;
    }
  | {
      loading: false;
      error?: undefined;
      value: T;
    };

type StateFromFunctionReturningPromise<T extends FunctionReturningPromise> =
  AsyncState<PromiseType<ReturnType<T>>>;

export type AsyncFnReturn<
  T extends FunctionReturningPromise = FunctionReturningPromise,
> = [StateFromFunctionReturningPromise<T>, T];
