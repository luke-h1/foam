import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppStateReturn {
  match: RegExp;
  nextAppState: AppStateStatus;
  callback: () => void;
}

export default function useAppState({
  callback,
  match,
  nextAppState,
}: UseAppStateReturn) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setAppStateVisible] = useState<AppStateStatus>(appState.current);

  // eslint-disable-next-line no-underscore-dangle
  const _handleAppStateChange = (newAppState: AppStateStatus) => {
    // if the state we're coming from matches *and*
    // the next state is the desired one, fire the cb

    if (appState.current.match(match) && newAppState === nextAppState) {
      callback();
    }

    appState.current = newAppState;
    setAppStateVisible(appState.current);
  };

  useEffect(() => {
    // first time check - opening app from killed state
    if (appState.current === nextAppState) {
      callback();
    }

    // setup the event listener
    const subscription = AppState.addEventListener(
      'change',
      _handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
