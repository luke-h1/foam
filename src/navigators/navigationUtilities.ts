/* eslint-disable react-hooks/rules-of-hooks */
import {
  PartialState,
  NavigationState,
  NavigationAction,
  createNavigationContainerRef,
} from '@react-navigation/native';
import newRelic from 'newrelic-react-native-agent';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { BaseConfig, type PersistNavigationConfig } from './config';

function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

export const RootNavigation = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  navigate(_name: string, _params?: any) {},
  goBack() {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resetRoot(_state?: PartialState<NavigationState> | NavigationState) {},
  getRootState(): NavigationState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    return {} as any;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch(_action: NavigationAction) {},
};

export const navigationRef = createNavigationContainerRef();

/**
 * Gets the current screen from any navigation state
 */
export function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState>,
): string {
  const route = state.routes?.[state.index ?? 0];

  // found active route - return the name
  if (!route?.state) {
    return route?.name as string;
  }

  // recursive call to deal with nested routers
  return getActiveRouteName(route.state);
}

/**
 * Hook that handles Android back button presses and forwards those on to
 * the navigation or allows exiting the app.
 */
export function useBackButtonHandler(canExit: (routeName: string) => boolean) {
  // ignore if IOS - no back button
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line no-useless-return
    return;
  }

  // we're using a ref here because we need to be able to update the canExit
  // function without re-setting up all the listeners

  const canExitRef = useRef(canExit);

  useEffect(() => {
    canExitRef.current = canExit;
  }, [canExit]);

  useEffect(() => {
    // fire this when the back button is pressed on android.

    const onBackPress = () => {
      if (!navigationRef.isReady()) {
        return false;
      }

      // grab the current route
      const routeName = getActiveRouteName(navigationRef.getRootState());

      // are we allowed to exit?
      if (canExitRef.current(routeName)) {
        // exit & let the system know we've handled the event
        BackHandler.exitApp();
        return true;
      }

      // we can't exit so let's turn this into a back action
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      return false;
    };

    // subscribe when the app is booted
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // unsub when we're done
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, []);
}

/**
 * This helper function will determine whether we should enable navigation persistence
 * based on a config setting and the __DEV__ environment (dev or prod).
 */
function navigationRestoredDefaultState(
  persistNavigation: PersistNavigationConfig,
) {
  if (persistNavigation === 'always') {
    return false;
  }

  if (persistNavigation === 'dev' && __DEV__) {
    return false;
  }

  if (persistNavigation === 'prod' && !__DEV__) {
    return false;
  }

  // all other cases, disable restoration by returning true
  return true;
}

/**
 * Custom hook for persisting navigation state
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useNavigationPersistence(storage: any, persistenceKey: string) {
  const [initialNavigationState, setInitialNavigationState] = useState();
  const isMounted = useIsMounted();

  const initNavState = navigationRestoredDefaultState(
    BaseConfig.persistNavigation,
  );
  const [isRestored, setIsRestored] = useState(initNavState);

  const routeNameRef = useRef<string>();

  const onNavigationStateChange = (state?: NavigationState): void => {
    const previousRouteName = routeNameRef.current;

    if (state) {
      const currentRouteName = getActiveRouteName(state);

      if (previousRouteName !== currentRouteName) {
        // track screens
        if (__DEV__ || process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.info(`currentRouteName -> ${currentRouteName}`);
        }

        // save the current route name for later comparison
        routeNameRef.current = currentRouteName;

        // persist state to storage
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        storage.save(persistenceKey, state);

        // log to new relic
        newRelic.onStateChange(state);
      }
    }
  };

  const restoreState = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const state = await storage.load(persistenceKey);
      if (state) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setInitialNavigationState(state);
      }
    } finally {
      if (isMounted()) {
        setIsRestored(true);
      }
    }
  };

  useEffect(() => {
    if (!isRestored) {
      void restoreState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestored]);

  return {
    onNavigationStateChange,
    restoreState,
    isRestored,
    initialNavigationState,
  };
}

/**
 * use this to navigate without the navigation
 * prop. If you have access to the navigation prop, do not use this.
 * More info: https://reactnavigation.org/docs/navigating-without-navigation-prop/
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function navigate(name: any, params?: any) {
  if (navigationRef.isReady()) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    navigationRef.navigate(name as never, params as never);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function resetRoot(params = { index: 0, routes: [] }) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot(params);
  }
}
