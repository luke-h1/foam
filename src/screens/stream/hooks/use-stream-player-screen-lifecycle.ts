import { type RefObject, useCallback, useRef } from 'react';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

import type { StreamPlayerRef } from '@app/components/stream-player/types';
import { useOnAppStateChange } from '@app/hooks/use-on-app-state-change';
import { lockPortrait } from '@app/utils/device/lockPortrait';

import { resolvePlayerAppStateAction } from '../util/resolvePlayerAppStateAction';

interface UseStreamPlayerScreenLifecycleOptions {
  /**
   * The keep-awake tag. Keep the screen awake while watching: auto-lock is
   * aggressive under Low Power Mode and during a long VOD.
   */
  keepAwakeTag: string;
  streamPlayerRef: RefObject<StreamPlayerRef | null>;

  /**
   * Runs after the player pauses on blur. Must be a stable function.
   */
  onBlur?: () => void;
}

/**
 * Holds a player screen (live or VOD) to its lifecycle: rotation and
 * keep-awake while focused, a pause on blur, and a pause that survives
 * backgrounding. Picture-in-picture is the exception - that playback is meant
 * to continue in the background.
 */
export function useStreamPlayerScreenLifecycle({
  keepAwakeTag,
  onBlur,
  streamPlayerRef,
}: UseStreamPlayerScreenLifecycleOptions): void {
  const wasPlayingBeforeBackgroundRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void ScreenOrientation.unlockAsync();
      void activateKeepAwakeAsync(keepAwakeTag);

      // Resume on refocus (the blur cleanup pauses the player); a no-op on cold mount.
      streamPlayerRef.current?.play();

      return () => {
        void deactivateKeepAwake(keepAwakeTag);
        lockPortrait();
        streamPlayerRef.current?.pause();
        onBlur?.();
      };
    }, [keepAwakeTag, onBlur, streamPlayerRef]),
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
