import { EffectCallback, useEffect, useRef } from 'react';

/**
 * A hook that runs an effect only once when a component mounts.
 * This is useful for initialization logic that should only run once.
 */
export function useEffectOnce(effect: EffectCallback) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      return effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
