import { observable } from '@legendapp/state';

import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/store/chat/types/chat-press-data';

export interface ChatOverlayState {
  channelId: string;
  isChattersSheetMounted: boolean;
  isEmoteSheetMounted: boolean;
  isSavedPhrasesSheetMounted: boolean;
  isSettingsSheetMounted: boolean;
  selectedBadge: BadgePressData | null;
  selectedEmote: EmotePressData | null;
  selectedEmoteAction: EmotePressData | null;
  selectedMessage: MessageActionData<'usernotice'> | null;
  selectedUser: UsernamePressData | null;
}

export function createEmptyChatOverlayState(
  channelId: string,
): ChatOverlayState {
  return {
    channelId,
    isChattersSheetMounted: false,
    isEmoteSheetMounted: false,
    isSavedPhrasesSheetMounted: false,
    isSettingsSheetMounted: false,
    selectedBadge: null,
    selectedEmote: null,
    selectedEmoteAction: null,
    selectedMessage: null,
    selectedUser: null,
  };
}

export const chatOverlays$ = observable(createEmptyChatOverlayState(''));
