/* eslint-disable  react-hooks/exhaustive-deps */
import { EffectCallback, useEffect, useState } from 'react';

/**
 * Simple hook that returns true once a component
 * has mounted.
 *
 * This is particularly useful for progressively
 * enhancing components in SSR where not all attributes
 * should be set until the client-side JS loads.
 */
export const useMounted = (effect?: EffectCallback, initialState = false) => {
  const [isMounted, setMounted] = useState(initialState);

  useEffect(() => {
    setMounted(true);

    if (effect) {
      return effect();
    }

    return undefined;
  }, []);

  return {
    isMounted,
    onMounted<T, R>(value: T, defaultValue?: R): T | R | undefined {
      return isMounted ? value : defaultValue;
    },
  };
};
