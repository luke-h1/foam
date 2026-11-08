import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { StreamPlayer } from '@app/components/stream-player/StreamPlayer';
import type { StreamPlayerRef } from '@app/components/stream-player/types';
import { EmptyState } from '@app/components/ui/empty-state/EmptyState';
import { PlayerBackButton } from '@app/screens/stream/components/PlayerBackButton';
import { PlayerIconButton } from '@app/screens/stream/components/PlayerIconButton';
import { theme } from '@app/styles/themes';

import { useLiveStreamOrientation } from './hooks/use-live-stream-orientation';
import { useSleepTimer } from './hooks/use-sleep-timer';
import { useStreamPlayerScreenLifecycle } from './hooks/use-stream-player-screen-lifecycle';
import { showSleepTimerMenu } from './util/showSleepTimerMenu';

interface VodPlayerScreenProps {
  id: string;
}

export function VodPlayerScreen({ id }: VodPlayerScreenProps) {
  const streamPlayerRef = useRef<StreamPlayerRef>(null);

  const sleepTimer = useSleepTimer({
    onExpire: () => {
      if (router.canGoBack()) {
        router.back();
      }
    },
  });

  const {
    contentWidth: videoWidth,
    insets,
    isLandscape,
    landscapeInsetLeft,
    landscapeInsetRight,
    layoutHeight,
    portraitTopInset,
  } = useLiveStreamOrientation();

  // Portrait pins 16:9 below the status bar, landscape fills the height; sizing the container to the video keeps the WebView video-sized with no letterboxing.
  const videoHeight = isLandscape ? layoutHeight : videoWidth * (9 / 16);

  useStreamPlayerScreenLifecycle({
    keepAwakeTag: 'vod-player',
    streamPlayerRef,
  });

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
          ref={streamPlayerRef}
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
