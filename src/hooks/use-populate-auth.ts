import { useEffect, useRef } from 'react';

import { router, useSegments } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { useIsRouterReady } from '@app/hooks/use-is-router-ready';

export function usePopulateAuth() {
  const { signInId } = useAuthContext();
  const routerReady = useIsRouterReady();
  const [firstSegment] = useSegments();
  const handledSignInIdRef = useRef(signInId);

  const canNavigate = routerReady && firstSegment !== 'auth-sheet';

  useEffect(() => {
    if (signInId === handledSignInIdRef.current || !canNavigate) {
      return;
    }

    handledSignInIdRef.current = signInId;
    router.replace('/tabs/following');
  }, [canNavigate, signInId]);
}
