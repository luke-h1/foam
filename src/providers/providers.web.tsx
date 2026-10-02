import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { PortalProvider } from 'react-native-teleport';

import { PressablesConfig } from 'pressto';
import { Toaster } from 'sonner-native';

import { AccentColorProvider } from '@app/context/accent-color-context';
import { AuthContextProvider } from '@app/context/auth-context';
import { useRecoveredFromError } from '@app/hooks/use-recovered-from-error';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/error-screen/error-boundary';
import { motion } from '@app/styles/motion';
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
  const { setRecoveredFromError } = useRecoveredFromError();

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
