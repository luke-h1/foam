import { RefObject, useEffect, useRef } from 'react';

/**
 * Ref that reports whether the component is currently mounted.
 */
export function useMountedRef(): RefObject<boolean> {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  });
  return isMountedRef;
}
