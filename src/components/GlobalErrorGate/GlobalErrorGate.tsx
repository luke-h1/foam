import { setFatalErrorListener } from '@app/lib/global-error-handlers';
import { useEffect, useState } from 'react';

/**
 * Bridges fatal errors caught by the global JS error handler into the
 * nearest ErrorBoundary: rethrowing during render makes the boundary
 * show ErrorDetails with its usual reset flow. Must be mounted inside
 * the root ErrorBoundary.
 */
export function GlobalErrorGate() {
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    setFatalErrorListener(setFatalError);
    return () => setFatalErrorListener(null);
  }, []);

  if (fatalError) {
    throw fatalError;
  }

  return null;
}
