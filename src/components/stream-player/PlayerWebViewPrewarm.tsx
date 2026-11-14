import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { getDeviceTier } from '@app/utils/device/deviceTier';
import { runWhenIdle } from '@app/utils/runWhenIdle';

const PREWARM_HTML = `<!doctype html><html><head>
<link rel="preconnect" href="https://player.twitch.tv">
<link rel="preconnect" href="https://static.twitchcdn.net">
<link rel="preconnect" href="https://gql.twitch.tv">
<link rel="preconnect" href="https://usher.ttvnw.net">
</head><body></body></html>`;

const PREWARM_MOUNT_DELAY_MS = 2500;

const PREWARM_LIFETIME_MS = 10_000;

/**
 * Warms WebKit's processes and Twitch preconnects once at boot, so the first
 * stream open skips process launch and TLS setup; unmounts itself after.
 */
export function PlayerWebViewPrewarm() {
  const [phase, setPhase] = useState<'idle' | 'warming' | 'done'>('idle');
  const skipPrewarm = getDeviceTier() === 'low';

  useEffect(() => {
    if (skipPrewarm) {
      return;
    }

    if (phase === 'idle') {
      let delayTimer: ReturnType<typeof setTimeout> | null = null;

      const task = runWhenIdle(() => {
        delayTimer = setTimeout(
          () => setPhase('warming'),
          PREWARM_MOUNT_DELAY_MS,
        );
      });

      return () => {
        task.cancel();
        clearTimeout(delayTimer ?? undefined);
      };
    }

    if (phase === 'warming') {
      const lifeTimer = setTimeout(() => setPhase('done'), PREWARM_LIFETIME_MS);
      return () => clearTimeout(lifeTimer);
    }

    return undefined;
  }, [phase, skipPrewarm]);

  if (skipPrewarm || phase !== 'warming') {
    return null;
  }

  return (
    <View style={styles.hidden} pointerEvents='none'>
      <WebView
        javaScriptEnabled={false}
        source={{ html: PREWARM_HTML }}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    height: 1,
    left: -2,
    opacity: 0,
    position: 'absolute',
    top: -2,
    width: 1,
  },
});
