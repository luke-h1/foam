import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { focusManager } from '@tanstack/react-query';

const onAppStateChange = (status: AppStateStatus) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

/**
 * Simple hook that triggers an update
 * when the app state changes.
 * in order for react-query to refetch
 * on app focus
 */
export const useOnAppStateChange = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => subscription.remove();
  }, []);
};
