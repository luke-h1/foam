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

import { ActionMenuHost } from '@app/components/action-menu-host/action-menu-host';
import { ChangelogAndroidHost } from '@app/components/changelog/changelog-android-host';
import { GlobalErrorGate } from '@app/components/global-error-gate/global-error-gate';
import { MediaPermissionHost } from '@app/components/media-permission-host/media-permission-host';
import { OfflineBanner } from '@app/components/offline-banner/offline-banner';
import { ShakeToReport } from '@app/components/shake-to-report/shake-to-report';
import { AccentColorProvider } from '@app/context/accent-color-context';
import { AuthContextProvider } from '@app/context/auth-context';
import { useDebugOptions } from '@app/hooks/use-debug-options';
import { useRecoveredFromError } from '@app/hooks/use-recovered-from-error';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { storage } from '@app/lib/storage';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/error-screen/error-boundary';
import { motion } from '@app/styles/motion';
import { toastStyle } from '@app/styles/toast';

import { AnalyticsProvider } from './analytics-provider';

function QueryProviderWithDevTools({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <QueryDevTools>{children}</QueryDevTools>
    </QueryProvider>
  );
}

// Required lazily behind __DEV__ so Metro drops the devtools bundle (~94KB)
// from release builds; the static import defeated the runtime gate below.
// SAFETY: the require resolves the same module the type import names.
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
      <Toaster style={toastStyle} />
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
                        <ActionMenuHost />
                        <ChangelogAndroidHost />
                        <MediaPermissionHost />
                      </PressablesConfig>
                    </QueryProviderWithDevTools>
                  </AnalyticsProvider>
                </PortalProvider>
              </KeyboardProvider>
            </ErrorBoundary>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </AccentColorProvider>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create({
  gestureContainer: { flex: 1 },
});
