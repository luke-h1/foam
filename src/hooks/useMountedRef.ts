import { RefObject, useEffect, useRef } from 'react';

/**
 * Returns a ref that can be used to determine if the
 * component is currently mounted or not.
 */
export default function useMountedRef(): RefObject<boolean> {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  });
  return isMountedRef;
}
