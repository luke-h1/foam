import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

const onAppStateChange = (status: AppStateStatus) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

/**
 * Simple hook that triggers an update when
 * the app is focussed in order for react-query to
 * refrech when a user focusses the app
 */
export default function useOnAppStateChange() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);
}
