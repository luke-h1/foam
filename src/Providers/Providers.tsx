import { AuthContextProvider, ChatContextProvider } from '@app/context';
import { useDebugOptions, useRecoveredFromError } from '@app/hooks';
import { BaseConfig } from '@app/navigators';
import { ErrorBoundary } from '@app/screens';
import { twitchApi } from '@app/services/api';
import { deleteTokens } from '@app/utils';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Toaster } from 'sonner-native';
import { CachedPhotosProvider } from './CachedPhotosProvider';
import { MediaLibraryPhotosProvider } from './MediaLibraryPhotosProvider';
import { ScreenDimensionsProvider } from './ScreenDimensionsProvider';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,
      refetchOnReconnect: true,
      retryDelay: 3000,
    },
  },
});

export function Providers({ children }: PropsWithChildren) {
  const { setRecoveredFromError } = useRecoveredFromError();

  const { ReactQueryDebug } = useDebugOptions();

  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  return (
    <AuthContextProvider>
      <MediaLibraryPhotosProvider>
        <ScreenDimensionsProvider>
          <CachedPhotosProvider>
            <ChatContextProvider>
              <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                <ErrorBoundary
                  catchErrors={BaseConfig.catchErrors}
                  onReset={() => setRecoveredFromError(true)}
                >
                  <KeyboardProvider>
                    <GestureHandlerRootView style={styles.gestureContainer}>
                      <BottomSheetModalProvider>
                        <QueryClientProvider client={queryClient}>
                          <Toaster />
                          {children}
                          {ReactQueryDebug?.enabled && (
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
                          )}
                        </QueryClientProvider>
                      </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                  </KeyboardProvider>
                </ErrorBoundary>
              </SafeAreaProvider>
            </ChatContextProvider>
          </CachedPhotosProvider>
        </ScreenDimensionsProvider>
      </MediaLibraryPhotosProvider>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create(() => ({
  gestureContainer: { flex: 1 },
}));
