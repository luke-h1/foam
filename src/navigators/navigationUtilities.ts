import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { BaseConfig, type PersistNavigationConfig } from './config';

type NavigationStateListener = () => void;

const stateListeners = new Set<NavigationStateListener>();

let currentRouteName = 'index';
let currentPathname = '/';
let isNavigationReady = false;

function emitStateChange() {
  for (const listener of stateListeners) {
    listener();
  }
}

export const RootNavigation = {
  goBack() {
    goBack();
  },
  getRootState() {
    return {
      index: 0,
      routes: [{ name: currentRouteName, path: currentPathname }],
    };
  },
  dispatch() {},
};

export const navigationRef = {
  isReady() {
    return isNavigationReady;
  },
  canGoBack() {
    return router.canGoBack();
  },
  goBack() {
    if (router.canGoBack()) {
      router.back();
    }
  },
  addListener(event: string, listener: NavigationStateListener) {
    if (event !== 'state') {
      return () => {};
    }

    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  },
  getRootState() {
    return RootNavigation.getRootState();
  },
};

export function setNavigationReady(ready: boolean) {
  isNavigationReady = ready;
}

export function syncNavigationState(pathname: string) {
  currentPathname = pathname;
  currentRouteName =
    pathname === '/' ? 'index' : pathname.split('/').filter(Boolean).join('/');
  emitStateChange();
}

export function getActiveRouteName(_state?: unknown): string {
  return currentRouteName;
}

const iosExit = () => false;

export function useBackButtonHandler(canExit: (routeName: string) => boolean) {
  const canExitRef = useRef(Platform.OS !== 'android' ? iosExit : canExit);

  useEffect(() => {
    canExitRef.current = canExit;
  }, [canExit]);

  useEffect(() => {
    const onBackPress = () => {
      const routeName = getActiveRouteName();

      if (canExitRef.current(routeName)) {
        BackHandler.exitApp();
        return true;
      }

      if (router.canGoBack()) {
        router.back();
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => subscription.remove();
  }, []);
}

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

  return true;
}

export function useNavigationPersistence(..._args: unknown[]) {
  const initNavState = navigationRestoredDefaultState(
    BaseConfig.persistNavigation,
  );

  return {
    onNavigationStateChange: () => {},
    restoreState: async () => {},
    isRestored: initNavState,
    initialNavigationState: undefined,
  };
}

export function goBack() {
  if (router.canGoBack()) {
    router.back();
  }
}
