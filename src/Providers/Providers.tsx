import { AuthContextProvider } from '@app/context';
import { useDebugOptions } from '@app/hooks';
import { twitchApi } from '@app/services/api';
import { queryClient } from '@app/services/query-client';
import { deleteTokens } from '@app/utils';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import { StyleSheet } from 'react-native-unistyles';
import { Toaster } from 'sonner-native';

export default function Providers({ children }: PropsWithChildren) {
  const { ReactQueryDebug } = useDebugOptions();

  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  return (
    <AuthContextProvider>
      <KeyboardProvider>
        <GestureHandlerRootView style={styles.gestureContainer}>
          <BottomSheetModalProvider>
            <QueryClientProvider client={queryClient}>
              <Toaster />
              {children}
              {ReactQueryDebug?.enabled && ReactQueryDebug && (
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
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create(() => ({
  gestureContainer: { flex: 1 },
}));
