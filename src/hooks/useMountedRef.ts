import { RefObject, useEffect, useRef } from 'react';

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
