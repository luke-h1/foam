import { useCallback, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, Stack, useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';

import { StreamPlayer } from '@app/components/stream-player/stream-player';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { PlayerBackButton } from '@app/screens/stream/components/player-back-button';
import { PlayerIconButton } from '@app/screens/stream/components/player-icon-button';
import { theme } from '@app/styles/themes';

import { useSleepTimer } from './hooks/use-sleep-timer';
import { getLiveStreamLayoutMetrics } from './util/get-live-stream-layout-metrics';
import { showSleepTimerMenu } from './util/show-sleep-timer-menu';

interface VodPlayerScreenProps {
  id: string;
}

// Keep the screen awake while watching. Auto-lock is more likely to trigger during a long VOD.
const KEEP_AWAKE_TAG = 'vod-player';

export function VodPlayerScreen({ id }: VodPlayerScreenProps) {
  const insets = useSafeAreaInsets();

  const sleepTimer = useSleepTimer({
    onExpire: () => {
      if (router.canGoBack()) {
        router.back();
      }
    },
  });

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const { isLandscape, layoutHeight, portraitTopInset, screenWidth } =
    getLiveStreamLayoutMetrics({
      insetTop: insets.top,
      windowHeight,
      windowWidth,
    });

  const landscapeInsetLeft = insets.left;
  const landscapeInsetRight = insets.right;

  const videoWidth = Math.max(
    1,
    screenWidth - landscapeInsetLeft - landscapeInsetRight,
  );

  // Portrait pins 16:9 below the status bar, landscape fills the height; sizing the container to the video keeps the WebView video-sized with no letterboxing.
  const videoHeight = isLandscape ? layoutHeight : videoWidth * (9 / 16);

  useEffect(() => {
    void ScreenOrientation.unlockAsync();
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }, []),
  );

  if (!id) {
    return (
      <EmptyState
        iconName='play.rectangle'
        heading='Video not found'
        content='This video may have been deleted or made private.'
        button='Close'
        buttonOnPress={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar verticalBarBehaviorIOS='disabled' />
      <Stack.Screen options={{ autoHideHomeIndicator: isLandscape }} />
      {isLandscape ? (
        <SystemBars hidden={{ navigationBar: true, statusBar: true }} />
      ) : null}
      <View
        style={[
          styles.videoContainer,
          {
            width: videoWidth,
            height: videoHeight,
            left: landscapeInsetLeft,
            top: portraitTopInset,
          },
        ]}
      >
        <StreamPlayer
          video={id}
          autoplay
          muted={false}
          height='100%'
          width='100%'
        />
      </View>

      <View
        style={{
          position: 'absolute',
          zIndex: 2,
          top: insets.top + theme.space12,
          left: theme.space16 + landscapeInsetLeft,
        }}
      >
        <PlayerBackButton />
      </View>

      <View
        style={[
          styles.closeButtonWrap,
          {
            top: insets.top + theme.space12,
            right: theme.space16 + landscapeInsetRight,
          },
        ]}
      >
        <PlayerIconButton
          icon='moon.zzz'
          label='Sleep timer'
          active={sleepTimer.isActive}
          onPress={() => showSleepTimerMenu(sleepTimer)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButtonWrap: {
    flexDirection: 'row',
    gap: theme.space12,
    position: 'absolute',
    zIndex: 2,
  },
  container: {
    backgroundColor: theme.colorBlack,
    flex: 1,
  },
  videoContainer: {
    alignItems: 'center',
    backgroundColor: theme.colorBlack,
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 1,
  },
});
