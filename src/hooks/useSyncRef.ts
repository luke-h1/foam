import { useLayoutEffect, useRef } from 'react';

export function useSyncRef<T>(value: T) {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  });

  return ref;
}
