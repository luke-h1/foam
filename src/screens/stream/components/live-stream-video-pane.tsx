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
 * Landscape-only gesture handlers; portrait leaves them unwired.
 */
const landscapeOnly = (isLandscape: boolean, handler: () => void) =>
  isLandscape ? handler : undefined;

/**
 * A back control for when the player overlay draws none: always on Android,
 * and on iOS when the custom player is off. The edge swipe alone is not a
 * visible way out.
 */
function FallbackBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      label='Go back'
      onPress={onPress}
      // videoContainer already sits at landscapeInsetLeft; only the local
      // offset here, or the button drifts inward on cutouts.
      style={[
        styles.fallbackBackButton,
        { left: theme.space8, top: theme.space8 },
      ]}
    >
      <SymbolView
        name={BACK_SYMBOL_NAME}
        size={18}
        tintColor={theme.colorWhite}
      />
    </Button>
  );
}

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
  // The player draws its own back control on iOS; Android gets the overlay below.
  const showsOwnBackButton = customPlayerEnabled && !isAndroid;

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
          onBackPress={showsOwnBackButton ? onBackPress : undefined}
          onPlay={onPlayerLoaded}
          onPlaybackLatencyChange={onPlaybackLatencyChange}
          onReady={onPlayerLoaded}
          onCreateClipPress={canCreateClip ? onCreateClipPress : undefined}
          onSharePress={resolvedChannelLogin ? onSharePress : undefined}
          onSleepTimerPress={onSleepTimerPress}
          sleepTimerActive={sleepTimerActive}
          onVideoAreaPress={landscapeOnly(isLandscape, onVideoAreaPress)}
          onVideoAreaSwipeDown={landscapeOnly(isLandscape, onExitLandscape)}
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

      {showsOwnBackButton ? null : <FallbackBackButton onPress={onBackPress} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fallbackBackButton: {
    alignItems: 'center',
    backgroundColor: theme.color.scrim.dark,
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    width: 36,
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
