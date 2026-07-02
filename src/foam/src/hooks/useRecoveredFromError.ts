import { useState } from 'react';

export function useRecoveredFromError() {
  const [recoveredFromError, setRecoveredFromError] = useState<boolean>(false);

  return {
    recoveredFromError,
    setRecoveredFromError,
  };
}
