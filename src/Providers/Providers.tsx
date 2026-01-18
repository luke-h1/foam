import { AuthContextProvider, useAuthContext } from '@app/context/AuthContext';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { BaseConfig } from '@app/navigators/config';
import { navigationRef } from '@app/navigators/navigationUtilities';
import { ErrorBoundary } from '@app/screens/ErrorScreen/ErrorBoundary';
import { twitchApi } from '@app/services/api';
import { createAuthErrorInterceptor } from '@app/services/api/interceptors';
import { storage } from '@app/services/storage-service';
import { deleteTokens } from '@app/utils/authentication/deleteTokens';
import { QueryProvider } from '@app/utils/react-query/reacy-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';
import { useReactNavigationDevTools } from '@rozenite/react-navigation-plugin';
import { useTanStackQueryDevTools } from '@rozenite/tanstack-query-plugin';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { PressablesConfig } from 'pressto';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Toaster } from 'sonner-native';
import { ScreenDimensionsProvider } from './ScreenDimensionsProvider';

function QueryProviderWithAuth({ children }: PropsWithChildren) {
  const { user, populateAuthState } = useAuthContext();
  const interceptorAdded = useRef(false);

  // Set up 401 error interceptor to handle auth refresh after OTA updates
  useEffect(() => {
    if (!interceptorAdded.current) {
      const authErrorInterceptor = createAuthErrorInterceptor(async () => {
        // When a 401 occurs, try to refresh auth state
        // This is especially important after OTA updates when the app reloads
        // and auth state might not be fully restored before API calls are made
        await populateAuthState();
      });

      twitchApi.addResponseInterceptor(authErrorInterceptor);
      interceptorAdded.current = true;

      return () => {
        twitchApi.removeResponseInterceptor(authErrorInterceptor);
        interceptorAdded.current = false;
      };
    }
    return undefined;
  }, [populateAuthState]);

  return (
    <QueryProvider currentUserId={user?.id}>
      <QueryDevTools>{children}</QueryDevTools>
    </QueryProvider>
  );
}

function QueryDevTools({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const { ReactQueryDebug } = useDebugOptions();
  useTanStackQueryDevTools(queryClient);

  return (
    <>
      <Toaster />
      {children}
      {ReactQueryDebug?.enabled && (
        <DevToolsBubble
          queryClient={queryClient}
          onCopy={async text => {
            try {
              await Clipboard.setStringAsync(text);
              return true;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
              return false;
            }
          }}
        />
      )}
    </>
  );
}

export function Providers({ children }: PropsWithChildren) {
  const { setRecoveredFromError } = useRecoveredFromError();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  useReactNavigationDevTools({ ref: navigationRef });
  useNetworkActivityDevTools();
  usePerformanceMonitorDevTools();
  useMMKVDevTools({
    storages: [storage],
  });

  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  return (
    <AuthContextProvider>
      <ScreenDimensionsProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ErrorBoundary
            catchErrors={BaseConfig.catchErrors}
            onReset={() => setRecoveredFromError(true)}
          >
            <KeyboardProvider>
              <GestureHandlerRootView style={styles.gestureContainer}>
                <BottomSheetModalProvider>
                  <QueryProviderWithAuth>
                    <PressablesConfig
                      globalHandlers={{
                        onPress: () => {
                          void Haptics.selectionAsync();
                        },
                      }}
                    >
                      {children}
                    </PressablesConfig>
                  </QueryProviderWithAuth>
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </KeyboardProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ScreenDimensionsProvider>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create(() => ({
  gestureContainer: { flex: 1 },
}));
