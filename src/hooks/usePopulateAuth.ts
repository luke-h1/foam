import { useEffect, useRef } from 'react';

import { router } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { isDeepLinkAuthInProgress } from '@app/navigators/deepLinkAuthState';

export function usePopulateAuth() {
  const { authState } = useAuthContext();
  const wasLoggedIn = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (!authState) {
      return undefined;
    }

    const previousLoggedIn = wasLoggedIn.current;
    wasLoggedIn.current = authState.isLoggedIn;

    // Only navigate on a genuine logged-out -> logged-in transition (e.g. the
    // user signs in from the auth sheet, which only dismisses the modal). The
    // initial hydration on app open (undefined -> logged in) is already routed
    // by the index redirect, so navigating here too pushes to following twice.
    if (previousLoggedIn !== false || !authState.isLoggedIn) {
      return undefined;
    }

    if (isDeepLinkAuthInProgress()) {
      return undefined;
    }

    // Defer until the next macrotask so the router tree is mounted.
    const timer = setTimeout(() => {
      router.replace('/tabs/following');
    }, 0);

    return () => clearTimeout(timer);
  }, [authState]);
}
