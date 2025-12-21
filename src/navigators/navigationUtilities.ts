import * as storage from '@app/utils/async-storage/async-storage';
import {
  PartialState,
  NavigationState,
  NavigationAction,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, Platform } from 'react-native';
import { BaseConfig, type PersistNavigationConfig } from './config';
import { AppStackParamList } from './AppNavigator';

type Storage = typeof storage;

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

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

/**
 * Gets the current screen from any navigation state
 */
export function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState>,
): string {
  const route = state.routes?.[state.index ?? 0];

  // found active route - return the name
  if (!route?.state) {
    return route?.name as keyof AppStackParamList;
  }

  // recursive call to deal with nested routers
  return getActiveRouteName(route.state as NavigationState<AppStackParamList>);
}

const iosExit = () => false;

/**
 * Hook that handles Android back button presses and forwards those on to
 * the navigation or allows exiting the app.
 */
/**
 * Hook that handles Android back button presses and forwards those on to
 * the navigation or allows exiting the app.
 * @see [BackHandler]{@link https://reactnative.dev/docs/backhandler}
 * @param {(routeName: string) => boolean} canExit - Function that returns whether we can exit the app.
 * @returns {void}
 */
export function useBackButtonHandler(canExit: (routeName: string) => boolean) {
  // The reason we're using a ref here is because we need to be able
  // to update the canExit function without re-setting up all the listeners
  const canExitRef = useRef(Platform.OS !== 'android' ? iosExit : canExit);

  useEffect(() => {
    canExitRef.current = canExit;
  }, [canExit]);

  useEffect(() => {
    // We'll fire this when the back button is pressed on Android.
    const onBackPress = () => {
      if (!navigationRef.isReady()) {
        return false;
      }

      // grab the current route
      const routeName = getActiveRouteName(navigationRef.getRootState());

      // are we allowed to exit?
      if (canExitRef.current(routeName)) {
        // exit and let the system know we've handled the event
        BackHandler.exitApp();
        return true;
      }

      // we can't exit, so let's turn this into a back action
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      return false;
    };

    // Subscribe when we come to life
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    // Unsubscribe when we're done
    return () => subscription.remove();
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

export function useNavigationPersistence(
  // eslint-disable-next-line no-shadow
  storage: Storage,
  persistenceKey: string,
) {
  const [initialNavigationState, setInitialNavigationState] = useState();
  const isMounted = useIsMounted();

  const initNavState = navigationRestoredDefaultState(
    BaseConfig.persistNavigation,
  );
  const [isRestored, setIsRestored] = useState(initNavState);

  const routeNameRef = useRef<string | null>(null);

  const onNavigationStateChange = (state?: NavigationState): void => {
    const previousRouteName = routeNameRef.current;

    if (state) {
      const currentRouteName = getActiveRouteName(state);

      if (previousRouteName !== currentRouteName) {
        // track screens
        if (__DEV__ || process.env.NODE_ENV === 'development') {
          console.info(`currentRouteName -> ${currentRouteName}`);
        }

        // save the current route name for later comparison
        routeNameRef.current = currentRouteName as keyof AppStackParamList;

        // persist state to storage
        void storage.save(persistenceKey, state);
      }
    }
  };
  const restoreState = async () => {
    try {
      const initialUrl = await Linking.getInitialURL();

      // Only restore the state if app has not started from a deep link
      if (!initialUrl) {
        const state = await storage.load(persistenceKey);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (state) setInitialNavigationState(state);
      }
    } finally {
      if (isMounted()) setIsRestored(true);
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
/**
 * resetRoot will reset the root navigation state to the given params.
 * @param {Parameters<typeof navigationRef.resetRoot>[0]} state - The state to reset the root to.
 * @returns {void}
 */
export function resetRoot(
  state: Parameters<typeof navigationRef.resetRoot>[0] = {
    index: 0,
    routes: [],
  },
) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot(state);
  }
}
