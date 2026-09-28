import { type RefObject, useCallback, useRef } from 'react';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

import type { StreamPlayerRef } from '@app/components/stream-player/types';
import { useOnAppStateChange } from '@app/hooks/use-on-app-state-change';
import { setMeasuredVideoLatencySeconds } from '@app/store/stream/video-latency';

import { resolvePlayerAppStateAction } from '../util/resolve-player-app-state-action';

const KEEP_AWAKE_TAG = 'live-stream';

/**
 * Holds the player to the screen's lifecycle: rotation and keep-awake while
 * focused, and a pause that survives backgrounding. Picture-in-picture is the
 * exception - that playback is meant to continue in the background.
 */
export function useLiveStreamPlayerLifecycle({
  onChatConnectionLost,
  streamPlayerRef,
}: {
  onChatConnectionLost: () => void;
  streamPlayerRef: RefObject<StreamPlayerRef | null>;
}): void {
  const wasPlayingBeforeBackgroundRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void ScreenOrientation.unlockAsync();
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);

      // Resume on refocus (the blur cleanup pauses the player); a no-op on cold mount.
      streamPlayerRef.current?.play();

      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);

        void ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );

        streamPlayerRef.current?.pause();
        setMeasuredVideoLatencySeconds(null);
        onChatConnectionLost();
      };
    }, [onChatConnectionLost, streamPlayerRef]),
  );

  useOnAppStateChange(transition => {
    const player = streamPlayerRef.current;

    if (!player) {
      return;
    }

    if (player.isPictureInPicture()) {
      wasPlayingBeforeBackgroundRef.current = false;
      return;
    }

    const { capturePlayState, pausePlayer, resumePlayer } =
      resolvePlayerAppStateAction(transition);

    if (capturePlayState) {
      wasPlayingBeforeBackgroundRef.current = !player.getPaused();
    }

    if (pausePlayer) {
      player.pause();
    }

    if (resumePlayer && wasPlayingBeforeBackgroundRef.current) {
      player.play();
    }

    if (resumePlayer) {
      wasPlayingBeforeBackgroundRef.current = false;
    }
  });
}
