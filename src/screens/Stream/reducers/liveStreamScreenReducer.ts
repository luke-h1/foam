import type { LandscapeChatCycleAction } from '../liveStreamLayout/getNextChatCycleAction';
import type { FullscreenChatMode } from '../liveStreamLayout/types';

export type LiveStreamScreenState = {
  fullscreenChatMode: FullscreenChatMode;
  isChatConnectionReady: boolean;
  isChatVisible: boolean;
  landscapeChatCycleAction: LandscapeChatCycleAction;
  landscapeChatWidth: number | null;
};

export type LiveStreamScreenAction =
  | { type: 'patch'; patch: Partial<LiveStreamScreenState> }
  | { type: 'setChatVisible'; isChatVisible: boolean }
  | { type: 'setFullscreenChatMode'; fullscreenChatMode: FullscreenChatMode }
  | {
      type: 'setLandscapeChatCycleAction';
      landscapeChatCycleAction: LandscapeChatCycleAction;
    }
  | { type: 'setLandscapeChatWidth'; landscapeChatWidth: number | null }
  | { type: 'setChatConnectionReady'; isChatConnectionReady: boolean };

export const initialLiveStreamScreenState: LiveStreamScreenState = {
  fullscreenChatMode: 'sidebar',
  isChatConnectionReady: false,
  isChatVisible: true,
  landscapeChatCycleAction: 'hide',
  landscapeChatWidth: null,
};

export function liveStreamScreenReducer(
  state: LiveStreamScreenState,
  action: LiveStreamScreenAction,
): LiveStreamScreenState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'setChatVisible':
      return { ...state, isChatVisible: action.isChatVisible };
    case 'setFullscreenChatMode':
      return { ...state, fullscreenChatMode: action.fullscreenChatMode };
    case 'setLandscapeChatCycleAction':
      return {
        ...state,
        landscapeChatCycleAction: action.landscapeChatCycleAction,
      };
    case 'setLandscapeChatWidth':
      return { ...state, landscapeChatWidth: action.landscapeChatWidth };
    case 'setChatConnectionReady':
      return { ...state, isChatConnectionReady: action.isChatConnectionReady };
    default:
      return state;
  }
}
