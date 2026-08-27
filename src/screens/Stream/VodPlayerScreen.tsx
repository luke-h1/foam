import { useCallback, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, Stack, useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

import { IconButton } from '@app/components/IconButton/IconButton';
import { StreamPlayer } from '@app/components/StreamPlayer/StreamPlayer';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { PlayerBackButton } from '@app/screens/Stream/components/PlayerBackButton';
import { theme } from '@app/styles/themes';

import { getLiveStreamLayoutMetrics } from './liveStreamLayout/getLiveStreamLayoutMetrics';
import { showSleepTimerMenu } from './showSleepTimerMenu';
import { useSleepTimer } from './useSleepTimer';

interface VodPlayerScreenProps {
  id: string;
}

// Keep the screen awake while watching - idle-timer auto-lock matters more on long-form VODs.
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

  // In landscape the safe-area insets land on left and right; reserve those, not the top.
  const landscapeInsetLeft = isLandscape ? insets.left : 0;
  const landscapeInsetRight = isLandscape ? insets.right : 0;
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
        heading='VOD not found'
        content='Could not open this VOD.'
        button='Close'
        buttonOnPress={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
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
        <IconButton
          icon={{
            type: 'symbol',
            name: 'moon.zzz',
            size: 18,
            color: sleepTimer.isActive ? theme.colorPrimary : undefined,
          }}
          label='Sleep timer'
          onPress={() => showSleepTimerMenu(sleepTimer)}
          size='2xl'
          style={styles.closeButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    justifyContent: 'center',
  },
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
