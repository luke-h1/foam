import { PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { PortalProvider } from 'react-native-teleport';

import { PressablesConfig } from 'pressto';
import { Toaster } from 'sonner-native';

import { AppBottomSheetProvider } from '@app/components/BottomSheet/BottomSheetProvider';
import { AccentColorProvider } from '@app/context/AccentColorContext';
import { AuthContextProvider } from '@app/context/AuthContext';
import { useSyncLightModeFlag } from '@app/hooks/firebase/useSyncLightModeFlag';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/ErrorScreen/ErrorBoundary';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

import { ScreenDimensionsProvider } from './ScreenDimensionsProvider/ScreenDimensionsProvider';

function QueryDevTools({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <>
      <Toaster
        style={{
          backgroundColor: theme.color.background[scheme],
          borderColor: theme.color.border[scheme],
          borderWidth: 1,
        }}
      />
      {children}
    </>
  );
}

function LightModeFlagSync() {
  useSyncLightModeFlag();
  return null;
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
                    <LightModeFlagSync />
                    <QueryDevTools>
                      <PressablesConfig
                        config={{ minScale: motion.pressMinScale }}
                      >
                        <AppBottomSheetProvider>
                          {children}
                        </AppBottomSheetProvider>
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
