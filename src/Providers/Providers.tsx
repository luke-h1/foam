import { AppBottomSheetProvider } from '@app/components/BottomSheet/BottomSheetProvider';
import { OfflineBanner } from '@app/components/OfflineBanner/OfflineBanner';
import { AuthContextProvider, useAuthContext } from '@app/context/AuthContext';
import { AccentColorProvider } from '@app/context/AccentColorContext';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/ErrorScreen/ErrorBoundary';
import { twitchApi } from '@app/services/api/clients';
import { storage } from '@app/lib/storage';
import { deleteTokens } from '@app/utils/authentication/deleteTokens';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';
import { useRequireProfilerDevTools } from '@rozenite/require-profiler-plugin';
import {
  createMMKVStorageAdapter,
  useRozeniteStoragePlugin,
} from '@rozenite/storage-plugin';
import { useTanStackQueryDevTools } from '@rozenite/tanstack-query-plugin';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { motion } from '@app/styles/motion';
import { PressablesConfig } from 'pressto';
import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PortalProvider } from 'react-native-teleport';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { ScreenDimensionsProvider } from './ScreenDimensionsProvider/ScreenDimensionsProvider';
import { theme } from '@app/styles/themes';
import { AnalyticsProvider } from './AnalyticsProvider';

function QueryProviderWithAuth({ children }: PropsWithChildren) {
  const { user } = useAuthContext();
  return (
    <QueryProvider currentUserId={user?.id}>
      <QueryDevTools>{children}</QueryDevTools>
    </QueryProvider>
  );
}

// Required lazily behind __DEV__ so Metro drops the devtools bundle (~94KB)
// from release builds; the static import defeated the runtime gate below.
const DevToolsBubble = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (
      require('react-native-react-query-devtools') as typeof import('react-native-react-query-devtools')
    ).DevToolsBubble
  : null;

function QueryDevelopmentTools() {
  const queryClient = useQueryClient();
  const { ReactQueryDebug } = useDebugOptions();

  useTanStackQueryDevTools(queryClient);

  if (!ReactQueryDebug?.enabled || !DevToolsBubble) {
    return null;
  }

  return (
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
  );
}

function QueryDevTools({ children }: PropsWithChildren) {
  return (
    <>
      <Toaster
        style={{
          backgroundColor: theme.color.background.dark,
          borderColor: theme.color.border.dark,
          borderWidth: 1,
        }}
      />
      {children}
      {__DEV__ ? <QueryDevelopmentTools /> : null}
    </>
  );
}

function DevTools() {
  useNetworkActivityDevTools();
  usePerformanceMonitorDevTools();
  useRequireProfilerDevTools();
  useRozeniteStoragePlugin({
    storages: [
      createMMKVStorageAdapter({
        storages: {
          storageService: storage,
        },
      }),
    ],
  });

  return null;
}

export function Providers({ children }: PropsWithChildren) {
  const { setRecoveredFromError } = useRecoveredFromError();

  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  return (
    <AuthContextProvider>
      <AccentColorProvider>
        <ScreenDimensionsProvider>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <GestureHandlerRootView style={styles.gestureContainer}>
              <ErrorBoundary
                catchErrors={BaseConfig.catchErrors}
                onReset={() => setRecoveredFromError(true)}
              >
                <KeyboardProvider>
                  <PortalProvider>
                    {__DEV__ ? <DevTools /> : null}
                    <AnalyticsProvider>
                      <QueryProviderWithAuth>
                        <OfflineBanner />
                        {/* No global press haptic: feed taps stay silent
                            so deliberate actions (send, block, refresh)
                            keep their weight. Haptics are opt-in per
                            control via lib/haptics. */}
                        <PressablesConfig
                          config={{ minScale: motion.pressMinScale }}
                        >
                          <AppBottomSheetProvider>
                            {children}
                          </AppBottomSheetProvider>
                        </PressablesConfig>
                      </QueryProviderWithAuth>
                    </AnalyticsProvider>
                  </PortalProvider>
                </KeyboardProvider>
              </ErrorBoundary>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </ScreenDimensionsProvider>
      </AccentColorProvider>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create({
  gestureContainer: { flex: 1 },
});
