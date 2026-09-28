import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { Button } from '@app/components/button/button';
import { StreamPlayer } from '@app/components/stream-player/stream-player';
import type { StreamPlayerRef } from '@app/components/stream-player/types';
import { BACK_SYMBOL_NAME } from '@app/components/ui/icon/constants';
import { SymbolView } from '@app/components/ui/icon/icon';
import { theme } from '@app/styles/themes';

import { StreamUnavailablePanel } from './stream-unavailable-panel';

const isAndroid = process.env.EXPO_OS === 'android';

type LiveStreamVideoPaneProps = {
  animatedStyle: AnimatedStyle<ViewStyle>;
  canCreateClip: boolean;
  customPlayerEnabled: boolean;
  displayName: string | undefined;
  isChannelOffline: boolean;
  isLandscape: boolean;
  isStreamUnavailable: boolean;
  onBackPress: () => void;
  onCreateClipPress: () => void;
  onExitLandscape: () => void;
  onPlaybackLatencyChange: (latencySeconds: number) => void;
  onPlayerLoaded: () => void;
  onRetry: () => void;
  onSharePress: () => void;
  onSleepTimerPress: () => void;
  onVideoAreaPress: () => void;
  playerRef: React.RefObject<StreamPlayerRef | null>;
  posterUrl: string | undefined;
  profileImageUrl: string | undefined;
  resolvedChannelLogin: string | undefined;
  shouldRenderStreamPlayer: boolean;
  sleepTimerActive: boolean;
  streamInfo: React.ComponentProps<typeof StreamPlayer>['streamInfo'];
};

/**
 * The video half of the screen: the player itself, the panel that replaces it
 * when the channel is offline or the request failed, and the chrome that only
 * appears in landscape or on Android.
 */
export function LiveStreamVideoPane({
  animatedStyle,
  canCreateClip,
  customPlayerEnabled,
  displayName,
  isChannelOffline,
  isLandscape,
  isStreamUnavailable,
  onBackPress,
  onCreateClipPress,
  onExitLandscape,
  onPlaybackLatencyChange,
  onPlayerLoaded,
  onRetry,
  onSharePress,
  onSleepTimerPress,
  onVideoAreaPress,
  playerRef,
  posterUrl,
  profileImageUrl,
  resolvedChannelLogin,
  shouldRenderStreamPlayer,
  sleepTimerActive,
  streamInfo,
}: LiveStreamVideoPaneProps) {
  return (
    <Animated.View
      testID='stream-player-container'
      style={[styles.videoContainer, animatedStyle]}
    >
      {shouldRenderStreamPlayer ? (
        <StreamPlayer
          ref={playerRef}
          channel={resolvedChannelLogin}
          height='100%'
          width='100%'
          autoplay
          muted={false}
          showOverlayControls={customPlayerEnabled}
          onBackPress={
            customPlayerEnabled && !isAndroid ? onBackPress : undefined
          }
          onPlay={onPlayerLoaded}
          onPlaybackLatencyChange={onPlaybackLatencyChange}
          onReady={onPlayerLoaded}
          onCreateClipPress={canCreateClip ? onCreateClipPress : undefined}
          onSharePress={resolvedChannelLogin ? onSharePress : undefined}
          onSleepTimerPress={onSleepTimerPress}
          sleepTimerActive={sleepTimerActive}
          onVideoAreaPress={isLandscape ? onVideoAreaPress : undefined}
          onVideoAreaSwipeDown={isLandscape ? onExitLandscape : undefined}
          onWebViewLoaded={onPlayerLoaded}
          posterUrl={posterUrl}
          streamInfo={streamInfo}
        />
      ) : null}

      {isStreamUnavailable ? (
        <StreamUnavailablePanel
          channelLogin={resolvedChannelLogin ?? ''}
          displayName={displayName}
          onRetry={onRetry}
          profileImageUrl={profileImageUrl}
          reason={isChannelOffline ? 'offline' : 'error'}
        />
      ) : null}

      {isLandscape ? (
        <SystemBars hidden={{ navigationBar: true, statusBar: true }} />
      ) : null}

      {isAndroid ? (
        <Button
          label='Go back'
          onPress={onBackPress}
          // videoContainer already sits at landscapeInsetLeft; only the local
          // offset here, or the button drifts inward on cutouts.
          style={[
            styles.androidBackButton,
            { left: theme.space8, top: theme.space8 },
          ]}
        >
          <SymbolView
            name={BACK_SYMBOL_NAME}
            size={18}
            tintColor={theme.colorWhite}
          />
        </Button>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  androidBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: theme.borderRadius999,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    width: 32,
    zIndex: 12,
  },
  videoContainer: {
    alignItems: 'center',
    backgroundColor: theme.colorBlack,
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
});
