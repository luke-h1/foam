import { StyleSheet } from 'react-native';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { PortalProvider } from 'react-native-teleport';

import { PressablesConfig } from 'pressto';
import { Toaster } from 'sonner-native';

import { AccentColorProvider } from '@app/context/AccentColorContext';
import { AuthContextProvider } from '@app/context/AuthContext';
import { setRecoveredFromError } from '@app/hooks/use-recovered-from-error';
import { QueryProvider } from '@app/lib/react-query/QueryProvider';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/error/ErrorBoundary';
import { motion, pressAnimation } from '@app/styles/motion';
import { toastStyle } from '@app/styles/toast';

function QueryDevTools({ children }: PropsWithChildren) {
  return (
    <>
      <Toaster style={toastStyle} />
      {children}
    </>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <AuthContextProvider>
      <AccentColorProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ErrorBoundary
            catchErrors={BaseConfig.catchErrors}
            onReset={() => setRecoveredFromError(true)}
          >
            <GestureHandlerRootView style={styles.gestureContainer}>
              <PortalProvider>
                <QueryProvider>
                  <QueryDevTools>
                    <PressablesConfig
                      animationType='timing'
                      animationConfig={pressAnimation}
                      config={{ minScale: motion.pressMinScale }}
                    >
                      {children}
                    </PressablesConfig>
                  </QueryDevTools>
                </QueryProvider>
              </PortalProvider>
            </GestureHandlerRootView>
          </ErrorBoundary>
        </SafeAreaProvider>
      </AccentColorProvider>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create({
  gestureContainer: { flex: 1 },
});
