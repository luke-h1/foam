import { assignTransientState } from '@app/store/chat/actions/transientState';
import {
  chatOverlays$,
  type ChatOverlayState,
  createEmptyChatOverlayState,
} from '@app/store/chat/observables/chatOverlays';
import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/store/chat/types/chatPressData';

/**
 * Opening an overlay closes whatever else was open - a stale selection behind
 * a new sheet leaks back when the new one dismisses.
 */
function replaceOverlay(channelId: string, patch: Partial<ChatOverlayState>) {
  chatOverlays$.set({
    ...createEmptyChatOverlayState(channelId),
    ...patch,
    channelId,
  });
}

function patchOverlay(channelId: string, patch: Partial<ChatOverlayState>) {
  const current = chatOverlays$.peek();
  chatOverlays$.set({
    ...(current.channelId === channelId
      ? current
      : createEmptyChatOverlayState(channelId)),
    ...patch,
    channelId,
  });
}

export function openChatBadgePreview(channelId: string, badge: BadgePressData) {
  replaceOverlay(channelId, { selectedBadge: badge });
}

export function openChatEmotePreview(channelId: string, emote: EmotePressData) {
  replaceOverlay(channelId, { selectedEmote: emote });
}

export function openChatEmoteSheet(channelId: string) {
  replaceOverlay(channelId, { isEmoteSheetMounted: true });
}

export function openChatMessageActions(
  channelId: string,
  message: MessageActionData<'usernotice'>,
) {
  replaceOverlay(channelId, { selectedMessage: message });
}

export function openChatSettingsSheet(channelId: string) {
  replaceOverlay(channelId, { isSettingsSheetMounted: true });
}

export function openChattersSheet(channelId: string) {
  replaceOverlay(channelId, { isChattersSheetMounted: true });
}

export function openSavedPhrasesSheet(channelId: string) {
  replaceOverlay(channelId, { isSavedPhrasesSheetMounted: true });
}

export function openChatUserActions(
  channelId: string,
  user: UsernamePressData,
) {
  replaceOverlay(channelId, { selectedUser: user });
}

/**
 * Opens the search tray behind the settings sheet, so dismissing the sheet
 * reveals the field.
 */
export function openChatMessageSearch(channelId: string) {
  assignTransientState(channelId, { searchActive: true });
  patchOverlay(channelId, { isSettingsSheetMounted: false });
}

export function closeChatOverlay(
  channelId: string,
  patch: Partial<ChatOverlayState>,
) {
  patchOverlay(channelId, patch);
}

/**
 * Test-only reset: production code relies on the read-time `channelId` guard
 * in the overlay state shape instead of imperative resets.
 */
export function resetChatOverlays(channelId: string) {
  chatOverlays$.set(createEmptyChatOverlayState(channelId));
}
