import { Platform } from 'react-native';
import type { ComponentProps } from 'react';

import { ControlsOverlay } from './controls-overlay';
import { DebugErrorOverlay, TouchBlockOverlay } from './stream-player-overlays';
import { PIP_ENABLED } from './util/pip-feature';

interface StreamPlayerOverlayStackProps {
  clip: string | undefined;
  controlsOpacity: ComponentProps<typeof ControlsOverlay>['opacity'];
  controlsVisible: boolean;
  lastHttpError: { statusCode: number; url: string } | null;
  muted: boolean;
  onBackPress: ComponentProps<typeof ControlsOverlay>['onBackPress'];
  onCreateClipPress: ComponentProps<
    typeof ControlsOverlay
  >['onCreateClipPress'];
  onDismissHttpError: () => void;
  onMutePress: () => void;
  onPlayPausePress: () => void;
  onRefresh: (() => void) | undefined;
  onSharePress: ComponentProps<typeof ControlsOverlay>['onSharePress'];
  onSleepTimerPress: ComponentProps<
    typeof ControlsOverlay
  >['onSleepTimerPress'];
  paused: boolean;
  pipActive: boolean;
  showNativeControls: boolean;
  sleepTimerActive: ComponentProps<typeof ControlsOverlay>['sleepTimerActive'];
  streamInfo: ComponentProps<typeof ControlsOverlay>['streamInfo'];
  togglePictureInPicture: () => void;
  videoTapGesture: ComponentProps<typeof TouchBlockOverlay>['gesture'];
}

/**
 * Everything drawn over the WebView: the tap blocker, the native controls and
 * the dev-only HTTP error panel.
 */
export function StreamPlayerOverlayStack({
  clip,
  controlsOpacity,
  controlsVisible,
  lastHttpError,
  muted,
  onBackPress,
  onCreateClipPress,
  onDismissHttpError,
  onMutePress,
  onPlayPausePress,
  onRefresh,
  onSharePress,
  onSleepTimerPress,
  paused,
  pipActive,
  showNativeControls,
  sleepTimerActive,
  streamInfo,
  togglePictureInPicture,
  videoTapGesture,
}: StreamPlayerOverlayStackProps) {
  return (
    <>
      {showNativeControls && <TouchBlockOverlay gesture={videoTapGesture} />}

      {__DEV__ && lastHttpError && (
        <DebugErrorOverlay
          error={lastHttpError}
          onDismiss={onDismissHttpError}
        />
      )}

      {showNativeControls && (
        <ControlsOverlay
          isVisible={controlsVisible}
          muted={muted}
          opacity={controlsOpacity}
          onBackPress={onBackPress}
          onMutePress={onMutePress}
          onPlayPausePress={onPlayPausePress}
          onCreateClipPress={onCreateClipPress}
          onPipPress={
            PIP_ENABLED && Platform.OS === 'ios' && !clip
              ? togglePictureInPicture
              : undefined
          }
          onRefresh={onRefresh}
          onSharePress={onSharePress}
          onSleepTimerPress={onSleepTimerPress}
          paused={paused}
          pipActive={pipActive}
          sleepTimerActive={sleepTimerActive}
          streamInfo={streamInfo}
        />
      )}
    </>
  );
}
