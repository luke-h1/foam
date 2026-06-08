import { useObservable, useSelector } from '@legendapp/state/react';

export interface ChatOverlayState<TEmote, TMessage, TUser> {
  channelId: string;
  isEmoteSheetMounted: boolean;
  isSettingsSheetMounted: boolean;
  selectedEmote: TEmote | null;
  selectedMessage: TMessage | null;
  selectedUser: TUser | null;
}

export function createEmptyChatOverlayState<TEmote, TMessage, TUser>(
  channelId: string,
): ChatOverlayState<TEmote, TMessage, TUser> {
  return {
    channelId,
    isEmoteSheetMounted: false,
    isSettingsSheetMounted: false,
    selectedEmote: null,
    selectedMessage: null,
    selectedUser: null,
  };
}

export function useChatOverlayState<TEmote, TMessage, TUser>(
  channelId: string,
) {
  const overlay$ = useObservable(
    createEmptyChatOverlayState<TEmote, TMessage, TUser>(channelId),
  );
  const rawOverlay = useSelector(overlay$);
  const overlay =
    rawOverlay.channelId === channelId
      ? rawOverlay
      : createEmptyChatOverlayState<TEmote, TMessage, TUser>(channelId);

  const replaceOverlay = (
    patch: Partial<ChatOverlayState<TEmote, TMessage, TUser>>,
  ) => {
    overlay$.set({
      ...createEmptyChatOverlayState<TEmote, TMessage, TUser>(channelId),
      ...patch,
      channelId,
    });
  };

  const patchOverlay = (
    patch: Partial<ChatOverlayState<TEmote, TMessage, TUser>>,
  ) => {
    const current = overlay$.peek();
    overlay$.set({
      ...(current.channelId === channelId
        ? current
        : createEmptyChatOverlayState<TEmote, TMessage, TUser>(channelId)),
      ...patch,
      channelId,
    });
  };

  return {
    overlay,
    patchOverlay,
    replaceOverlay,
  };
}
