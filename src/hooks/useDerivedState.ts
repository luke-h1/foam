import { useEffect, useState } from 'react';

export function useDerivedState<T>(originalState: T) {
  const [state, setState] = useState<T>(originalState);

  useEffect(() => {
    setState(prev => (prev !== originalState ? originalState : prev));
  }, [originalState]);

  return [state, setState] as const;
}
