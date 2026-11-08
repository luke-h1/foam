import { type RefObject, useCallback, useRef } from 'react';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

import type { StreamPlayerRef } from '@app/components/stream-player/types';
import { useOnAppStateChange } from '@app/hooks/use-on-app-state-change';
import { lockPortrait } from '@app/utils/device/lockPortrait';

import { resolvePlayerAppStateAction } from '../util/resolvePlayerAppStateAction';

interface UseStreamPlayerScreenLifecycleOptions {
  keepAwakeTag: string;
  streamPlayerRef: RefObject<StreamPlayerRef | null>;

  onBlur?: () => void;
}

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
