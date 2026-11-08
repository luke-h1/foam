import { memo, type RefObject, useEffect } from 'react';

import type { ChatMessagesSource } from '@app/components/chat/types/chat-messages-source';
import { setEmojiEmotes } from '@app/store/chat/actions/emoji-emotes';
import { useChannelEmoteDataForReprocess } from '@app/store/chat/react/selectors';
import { usePreference } from '@app/store/preference-store';

import type { EmoteLoadingStatus } from '../hooks/use-chat-emote-loader';
import { useEmoteReprocessing } from '../hooks/use-emote-reprocessing';

interface ChatEmoteReprocessorProps {
  channelId: string;
  emoteLoadStatus: EmoteLoadingStatus;
  messages$: ChatMessagesSource;
  processedMessageIdsRef: RefObject<Set<string>>;
  reprocessKey: string;
  userLogin?: string | null;
}

export const ChatEmoteReprocessor = memo(
  ({
    channelId,
    emoteLoadStatus,
    messages$,
    processedMessageIdsRef,
    reprocessKey,
    userLogin,
  }: ChatEmoteReprocessorProps) => {
    const channelEmoteData = useChannelEmoteDataForReprocess(channelId);
    const emojiStyle = usePreference('emojiStyle');
    const show7TvEmotes = usePreference('show7TvEmotes');
    const showChatGifs = usePreference('showChatGifs');

    useEffect(() => {
      setEmojiEmotes(emojiStyle);
    }, [emojiStyle]);

    useEmoteReprocessing({
      channelId,
      channelEmoteData,
      messages$,
      emoteLoadStatus,
      processedMessageIdsRef,
      reprocessKey,
      show7TvEmotes,
      showChatGifs,
      userLogin,
    });

    return null;
  },
);
