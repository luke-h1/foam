import { useEffect, useRef } from 'react';

import { router, useSegments } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { useIsRouterReady } from '@app/hooks/use-is-router-ready';

/**
 * The one owner of the move to Following after a sign-in. A restore of a
 * stored session at startup does not change `signInId`, so the index redirect
 * routes that case.
 */
export function usePopulateAuth() {
  const { signInId } = useAuthContext();
  const routerReady = useIsRouterReady();
  const [firstSegment] = useSegments();
  const handledSignInIdRef = useRef(signInId);

  // The auth sheet dismisses itself on success. A replace while it is still
  // on top replaces the sheet route, so wait until it has closed.
  const canNavigate = routerReady && firstSegment !== 'auth-sheet';

  useEffect(() => {
    if (signInId === handledSignInIdRef.current || !canNavigate) {
      return;
    }

    handledSignInIdRef.current = signInId;
    router.replace('/tabs/following');
  }, [canNavigate, signInId]);
}
