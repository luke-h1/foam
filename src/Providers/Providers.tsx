import { ApolloProvider } from '@apollo/client/react';
import { AuthContextProvider, useAuthContext } from '@app/context/AuthContext';
import { AccentColorProvider } from '@app/context/AccentColorContext';
import { useDebugOptions } from '@app/hooks/useDebugOptions';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { BaseConfig } from '@app/navigators/config';
import { ErrorBoundary } from '@app/screens/ErrorScreen/ErrorBoundary';
import { twitchApi } from '@app/services/api';
import { sevenTvV4Client } from '@app/services/gql/client';
import { storage } from '@app/services/storage-service';
import { deleteTokens } from '@app/utils/authentication/deleteTokens';
import { QueryProvider } from '@app/utils/react-query/reacy-query';
import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';
import { useTanStackQueryDevTools } from '@rozenite/tanstack-query-plugin';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { selection } from '@app/services/haptics-service';
import { PressablesConfig } from 'pressto';
import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { ScreenDimensionsProvider } from './ScreenDimensionsProvider/ScreenDimensionsProvider';
import { theme } from '@app/styles/themes';

function QueryProviderWithAuth({ children }: PropsWithChildren) {
  const { user } = useAuthContext();
  return (
    <QueryProvider currentUserId={user?.id}>
      <QueryDevTools>{children}</QueryDevTools>
    </QueryProvider>
  );
}

function QueryDevelopmentTools() {
  const queryClient = useQueryClient();
  const { ReactQueryDebug } = useDebugOptions();

  useTanStackQueryDevTools(queryClient);

  if (!ReactQueryDebug?.enabled) {
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

function DevelopmentTooling() {
  useNetworkActivityDevTools();
  usePerformanceMonitorDevTools();
  useMMKVDevTools({
    storages: [storage],
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
        <ApolloProvider client={sevenTvV4Client}>
          <ScreenDimensionsProvider>
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
              <ErrorBoundary
                catchErrors={BaseConfig.catchErrors}
                onReset={() => setRecoveredFromError(true)}
              >
                <KeyboardProvider>
                  <GestureHandlerRootView style={styles.gestureContainer}>
                    {__DEV__ ? <DevelopmentTooling /> : null}
                    <QueryProviderWithAuth>
                      <PressablesConfig
                        globalHandlers={{
                          onPress: () => {
                            void selection();
                          },
                        }}
                      >
                        {children}
                      </PressablesConfig>
                    </QueryProviderWithAuth>
                  </GestureHandlerRootView>
                </KeyboardProvider>
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
