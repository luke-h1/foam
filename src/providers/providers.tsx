import { StyleSheet } from 'react-native';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { PortalProvider } from 'react-native-teleport';

import { PressablesConfig } from 'pressto';
import { Toaster } from 'sonner-native';

import { ActionMenuHost } from '@app/components/action-menu-host/action-menu-host';
import { ChangelogAndroidHost } from '@app/components/changelog/changelog-android-host';
import { SharedPaintAnimationDrivers } from '@app/components/chat/components/chat-message/cosmetic-username/util/shared-paint-animation-frames';
import { GlobalErrorGate } from '@app/components/global-error-gate/global-error-gate';
import { MediaPermissionHost } from '@app/components/media-permission-host/media-permission-host';
import { OfflineBanner } from '@app/components/offline-banner/offline-banner';
import { ShakeToReport } from '@app/components/shake-to-report/shake-to-report';
import { AccentColorProvider } from '@app/context/accent-color-context';
import { AuthContextProvider } from '@app/context/auth-context';
import { setRecoveredFromError } from '@app/hooks/use-recovered-from-error';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/error/error-boundary';
import { motion, pressAnimation } from '@app/styles/motion';
import { toastStyle } from '@app/styles/toast';

import { AnalyticsProvider } from './analytics-provider';

function QueryProviderWithDevTools({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <QueryDevTools>{children}</QueryDevTools>
    </QueryProvider>
  );
}

// SAFETY: the require resolves the same module the type import names.
const devTools = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./dev-tools') as typeof import('./dev-tools'))
  : null;

function QueryDevTools({ children }: PropsWithChildren) {
  return (
    <>
      <Toaster style={toastStyle} />
      {children}
      {devTools ? <devTools.QueryDevelopmentTools /> : null}
    </>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <AuthContextProvider>
      <AccentColorProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <GestureHandlerRootView style={styles.gestureContainer}>
            <ErrorBoundary
              catchErrors={BaseConfig.catchErrors}
              onReset={() => setRecoveredFromError(true)}
            >
              <KeyboardProvider preload={false}>
                <PortalProvider>
                  {devTools ? <devTools.DevTools /> : null}
                  <SharedPaintAnimationDrivers />
                  <AnalyticsProvider>
                    <QueryProviderWithDevTools>
                      <GlobalErrorGate />
                      <ShakeToReport />
                      <OfflineBanner />
                      {/* No global press haptic. Feed taps stay silent,
                            so only deliberate actions (send, block,
                            refresh) give haptic feedback. Each control
                            opts in through lib/haptics. */}
                      <PressablesConfig
                        animationType='timing'
                        animationConfig={pressAnimation}
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
