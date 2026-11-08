import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLinkingURL } from 'expo-linking';
import { router } from 'expo-router';

import { LoadingState } from '@app/components/loading-state/LoadingState';
import { Text } from '@app/components/ui/text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { completeAuthWithCallbackUrl } from '@app/context/authLinking';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

function leaveCallbackScreen() {
  router.replace('/tabs/top');
}

/**
 * A successful exchange moves on through usePopulateAuth. This screen only
 * leaves by itself when the URL has no token or the exchange fails, so the
 * spinner never stays forever.
 */
export function AuthCallbackScreen() {
  const url = useLinkingURL();
  const { loginWithTwitch } = useAuthContext();
  const loginWithTwitchRef = useSyncRef(loginWithTwitch);

  useEffect(() => {
    let cancelled = false;

    if (!url) {
      leaveCallbackScreen();
      return undefined;
    }

    completeAuthWithCallbackUrl(url, loginWithTwitchRef.current)
      .then(result => {
        if (!cancelled && !result.ok) {
          leaveCallbackScreen();
        }
      })
      .catch((error: unknown) => {
        logger.auth.warn('Auth callback screen exchange failed', { error });

        if (!cancelled) {
          leaveCallbackScreen();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loginWithTwitchRef, url]);

  return (
    <View style={styles.container}>
      <LoadingState style={styles.spinner} />
      <Text type='headline' color='gray' align='center'>
        Completing sign in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colorBlack,
    flex: 1,
    justifyContent: 'center',
  },
  spinner: {
    flex: 0,
    marginBottom: theme.space8,
  },
});
