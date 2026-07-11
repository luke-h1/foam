import { useEffect, useState } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Preconnect hints for the hosts the Twitch embed hits first (embed page,
 * player assets, GQL, HLS manifests), so DNS and TLS are already done when
 * the real player mounts.
 */
const PREWARM_HTML = `<!doctype html><html><head>
<link rel="preconnect" href="https://player.twitch.tv">
<link rel="preconnect" href="https://static.twitchcdn.net">
<link rel="preconnect" href="https://gql.twitch.tv">
<link rel="preconnect" href="https://usher.ttvnw.net">
</head><body></body></html>`;

// Boot is busy; wait out the first transitions before spending memory on the
// throwaway WebView, then drop it once WebKit's processes are warm.
const PREWARM_MOUNT_DELAY_MS = 2_500;
const PREWARM_LIFETIME_MS = 10_000;

/**
 * Spawns the WebView engine's content/networking processes and preconnects
 * to Twitch's player hosts once at boot, so the first stream open skips
 * process launch and TLS setup. Renders nothing visible, never intercepts
 * touches, and unmounts itself after a few seconds; the warmed processes and
 * the shared process pool outlive it.
 */
export function PlayerWebViewPrewarm() {
  const [phase, setPhase] = useState<'idle' | 'warming' | 'done'>('idle');

  useEffect(() => {
    if (phase === 'idle') {
      let delayTimer: ReturnType<typeof setTimeout> | null = null;
      const task = InteractionManager.runAfterInteractions(() => {
        delayTimer = setTimeout(
          () => setPhase('warming'),
          PREWARM_MOUNT_DELAY_MS,
        );
      });
      return () => {
        task.cancel();
        if (delayTimer) {
          clearTimeout(delayTimer);
        }
      };
    }

    if (phase === 'warming') {
      const lifeTimer = setTimeout(() => setPhase('done'), PREWARM_LIFETIME_MS);
      return () => clearTimeout(lifeTimer);
    }

    return undefined;
  }, [phase]);

  if (phase !== 'warming') {
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
