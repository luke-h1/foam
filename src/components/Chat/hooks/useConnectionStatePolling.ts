import { useEffect, useState } from 'react';

/**
 * Polls a getter every interval and exposes the result as state.
 * Use for connection state that doesn't trigger React updates (e.g. ref-based or external).
 */
export function useConnectionStatePolling(
  getState: () => boolean,
  intervalMs = 1000,
): boolean {
  const [state, setState] = useState(getState);

  useEffect(() => {
    const check = () => setState(getState());
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [getState, intervalMs]);

  return state;
}
