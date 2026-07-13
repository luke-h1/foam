import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { PortalProvider } from 'react-native-teleport';

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
import { PressablesConfig } from 'pressto';
import { Toaster } from 'sonner-native';

import { GlobalErrorGate } from '@app/components/GlobalErrorGate/GlobalErrorGate';
import { OfflineBanner } from '@app/components/OfflineBanner/OfflineBanner';
import { ShakeToReport } from '@app/components/ShakeToReport/ShakeToReport';
import { AccentColorProvider } from '@app/context/AccentColorContext';
import { AuthContextProvider } from '@app/context/AuthContext';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { storage } from '@app/lib/storage';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/ErrorScreen/ErrorBoundary';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

import { AnalyticsProvider } from './AnalyticsProvider';
import { ScreenDimensionsProvider } from './ScreenDimensionsProvider/ScreenDimensionsProvider';

function QueryProviderWithDevTools({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
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
                <KeyboardProvider preload>
                  <PortalProvider>
                    {__DEV__ ? <DevTools /> : null}
                    <AnalyticsProvider>
                      <QueryProviderWithDevTools>
                        <GlobalErrorGate />
                        <ShakeToReport />
                        <OfflineBanner />
                        {/* No global press haptic: feed taps stay silent
                            so deliberate actions (send, block, refresh)
                            keep their weight. Haptics are opt-in per
                            control via lib/haptics. */}
                        <PressablesConfig
                          config={{ minScale: motion.pressMinScale }}
                        >
                          {children}
                        </PressablesConfig>
                      </QueryProviderWithDevTools>
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
