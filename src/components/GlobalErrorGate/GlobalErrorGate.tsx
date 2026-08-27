import { useEffect, useState } from 'react';

import { setFatalErrorListener } from '@app/lib/global-error-handlers';

/**
 * Bridges fatal global JS errors into the nearest ErrorBoundary by rethrowing
 * during render; must be mounted inside the root ErrorBoundary.
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
