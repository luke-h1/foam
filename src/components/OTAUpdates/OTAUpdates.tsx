import { useAuthContext } from '@app/context/AuthContext';
import { useOTAUpdates } from '@app/hooks/useOTAUpdates';

export function OTAUpdates() {
  const { ready } = useAuthContext();

  useOTAUpdates({ isReady: ready });

  return null;
}
