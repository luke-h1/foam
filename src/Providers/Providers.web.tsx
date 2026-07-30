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

import { AccentColorProvider } from '@app/context/AccentColorContext';
import { AuthContextProvider } from '@app/context/AuthContext';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/ErrorScreen/ErrorBoundary';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

import { ScreenDimensionsProvider } from './ScreenDimensionsProvider/ScreenDimensionsProvider';

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
    </>
  );
}

export function Providers({ children }: PropsWithChildren) {
  const { setRecoveredFromError } = useRecoveredFromError();

  return (
    <AuthContextProvider>
      <AccentColorProvider>
        <ScreenDimensionsProvider>
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
        </ScreenDimensionsProvider>
      </AccentColorProvider>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create({
  gestureContainer: { flex: 1 },
});
