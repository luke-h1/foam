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

import { ActionMenuHost } from '@app/components/action-menu-host/ActionMenuHost';
import { ChangelogAndroidHost } from '@app/components/changelog/ChangelogAndroidHost';
import { SharedPaintAnimationDrivers } from '@app/components/chat/components/chat-message/cosmetic-username/util/sharedPaintAnimationFrames';
import { GlobalErrorGate } from '@app/components/global-error-gate/GlobalErrorGate';
import { MediaPermissionHost } from '@app/components/media-permission-host/MediaPermissionHost';
import { OfflineBanner } from '@app/components/offline-banner/OfflineBanner';
import { ShakeToReport } from '@app/components/shake-to-report/ShakeToReport';
import { AccentColorProvider } from '@app/context/AccentColorContext';
import { AuthContextProvider } from '@app/context/AuthContext';
import { setRecoveredFromError } from '@app/hooks/use-recovered-from-error';
import { QueryProvider } from '@app/lib/react-query/QueryProvider';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/error/ErrorBoundary';
import { motion, pressAnimation } from '@app/styles/motion';
import { toastStyle } from '@app/styles/toast';

import { AnalyticsProvider } from './AnalyticsProvider';

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
    (require('./DevTools') as typeof import('./DevTools'))
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
