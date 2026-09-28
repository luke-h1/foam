import { type Dispatch, useCallback, useRef } from 'react';

import type { useUpdatePreferences } from '@app/store/preference-store';

import type { FullscreenChatMode } from '../types';
import { clampLandscapeChatWidth } from '../util/clamp-landscape-chat-width';
import {
  getNextChatCycleAction,
  type LandscapeChatCycleAction,
} from '../util/get-next-chat-cycle-action';
import type { LiveStreamScreenAction } from '../util/live-stream-screen-reducer';

// A double-tap on the toggle would otherwise land two state changes in one frame.
const CHAT_TOGGLE_DEBOUNCE_MS = 450;

/**
 * Each cycle step names the next one, so tapping the control walks
 * sidebar -> overlay -> hidden and back.
 */
const CHAT_CYCLE_STEPS = {
  hide: { isChatVisible: false, landscapeChatCycleAction: 'show' },
  show: {
    fullscreenChatMode: 'sidebar',
    isChatVisible: true,
    landscapeChatCycleAction: 'overlay',
  },
  overlay: {
    fullscreenChatMode: 'overlay',
    isChatVisible: true,
    landscapeChatCycleAction: 'hide',
  },
} satisfies Record<
  LandscapeChatCycleAction,
  {
    fullscreenChatMode?: FullscreenChatMode;
    isChatVisible: boolean;
    landscapeChatCycleAction: LandscapeChatCycleAction;
  }
>;

/**
 * Owns how chat is shown beside the player: visibility, the landscape cycle
 * between sidebar, overlay and hidden, and the persisted sidebar width.
 */
export function useLiveStreamChatControls({
  contentWidth,
  dispatchUi,
  fullscreenChatMode,
  isChatVisible,
  landscapeChatCycleAction,
  updatePreferences,
}: {
  contentWidth: number;
  dispatchUi: Dispatch<LiveStreamScreenAction>;
  fullscreenChatMode: FullscreenChatMode;
  isChatVisible: boolean;
  landscapeChatCycleAction: LandscapeChatCycleAction;
  updatePreferences: ReturnType<typeof useUpdatePreferences>;
}) {
  const lastChatToggleTimeRef = useRef<number>(0);

  const commitLandscapeChatWidth = useCallback(
    (width: number) => {
      const clampedWidth = clampLandscapeChatWidth(
        width,
        contentWidth,
        fullscreenChatMode,
      );

      dispatchUi({
        type: 'setLandscapeChatWidth',
        landscapeChatWidth: clampedWidth,
      });

      updatePreferences({ landscapeChatWidth: clampedWidth });
    },
    [contentWidth, fullscreenChatMode, dispatchUi, updatePreferences],
  );

  const applyLandscapeChatCycleAction = useCallback(
    (action: LandscapeChatCycleAction) => {
      dispatchUi({ type: 'patch', patch: CHAT_CYCLE_STEPS[action] });
    },
    [dispatchUi],
  );

  const canToggleChat = useCallback(() => {
    const now = Date.now();

    if (now - lastChatToggleTimeRef.current < CHAT_TOGGLE_DEBOUNCE_MS) {
      return false;
    }

    lastChatToggleTimeRef.current = now;
    return true;
  }, []);

  const toggleChat = useCallback(() => {
    if (!canToggleChat()) {
      return;
    }

    const nextVisible = !isChatVisible;

    dispatchUi({
      type: 'patch',
      patch: {
        isChatVisible: nextVisible,
        landscapeChatCycleAction: getNextChatCycleAction(
          nextVisible,
          fullscreenChatMode,
        ),
      },
    });
  }, [canToggleChat, dispatchUi, fullscreenChatMode, isChatVisible]);

  const cycleLandscapeChatMode = useCallback(() => {
    if (!canToggleChat()) {
      return;
    }

    applyLandscapeChatCycleAction(landscapeChatCycleAction);
  }, [applyLandscapeChatCycleAction, canToggleChat, landscapeChatCycleAction]);

  const closeLandscapeChatBySwipe = useCallback(() => {
    applyLandscapeChatCycleAction('hide');
  }, [applyLandscapeChatCycleAction]);

  return {
    closeLandscapeChatBySwipe,
    commitLandscapeChatWidth,
    cycleLandscapeChatMode,
    toggleChat,
  };
}
