import { observable } from '@legendapp/state';

import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/components/Chat/components/ChatMessage/RichChatMessage.types';

export interface ChatOverlayState {
  /**
   * Which channel the selections belong to. Reads compare it before trusting
   * the state, so a channel switch can't surface the previous channel's sheet.
   */
  channelId: string;
  isChattersSheetMounted: boolean;
  isEmoteSheetMounted: boolean;
  isSavedPhrasesSheetMounted: boolean;
  isSettingsSheetMounted: boolean;
  selectedBadge: BadgePressData | null;
  selectedEmote: EmotePressData | null;
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
    selectedMessage: null,
    selectedUser: null,
  };
}

export const chatOverlays$ = observable(createEmptyChatOverlayState(''));
