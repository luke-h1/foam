import { useEffect, useRef } from 'react';

export const usePrevious = <T extends object>(value: T): T | undefined => {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current as T | undefined;
};
