import { ApolloProvider } from '@apollo/client/react';
import { AppBottomSheetProvider } from '@app/components/BottomSheet/BottomSheetProvider';
import { AuthContextProvider, useAuthContext } from '@app/context/AuthContext';
import { AccentColorProvider } from '@app/context/AccentColorContext';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/ErrorScreen/ErrorBoundary';
import { twitchApi } from '@app/services/api/clients';
import { sevenTvV4Client } from '@app/services/gql/client';
import { deleteTokens } from '@app/utils/authentication/deleteTokens';
import { QueryProvider } from '@app/lib/react-query/query-provider';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';
import { PressablesConfig } from 'pressto';
import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalProvider } from 'react-native-teleport';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { ScreenDimensionsProvider } from './ScreenDimensionsProvider/ScreenDimensionsProvider';

function QueryProviderWithAuth({ children }: PropsWithChildren) {
  const { user } = useAuthContext();
  return <QueryProvider currentUserId={user?.id}>{children}</QueryProvider>;
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
    </>
  );
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
        <ApolloProvider client={sevenTvV4Client}>
          <ScreenDimensionsProvider>
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
              <ErrorBoundary
                catchErrors={BaseConfig.catchErrors}
                onReset={() => setRecoveredFromError(true)}
              >
                <GestureHandlerRootView style={styles.gestureContainer}>
                  <PortalProvider>
                    <QueryProviderWithAuth>
                      <QueryDevTools>
                        <PressablesConfig
                          config={{ minScale: motion.pressMinScale }}
                        >
                          <AppBottomSheetProvider>
                            {children}
                          </AppBottomSheetProvider>
                        </PressablesConfig>
                      </QueryDevTools>
                    </QueryProviderWithAuth>
                  </PortalProvider>
                </GestureHandlerRootView>
              </ErrorBoundary>
            </SafeAreaProvider>
          </ScreenDimensionsProvider>
        </ApolloProvider>
      </AccentColorProvider>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create({
  gestureContainer: { flex: 1 },
});
