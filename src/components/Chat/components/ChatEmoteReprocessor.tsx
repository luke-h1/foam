import { memo, RefObject, useEffect } from 'react';

import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { useChannelEmoteDataForReprocess } from '@app/store/chat/react/selectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { usePreference } from '@app/store/preferenceStore';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';

import { useEmoteReprocessing } from '../hooks/useEmoteReprocessing';

export const ChatEmoteReprocessor = memo(
  ({
    channelId,
    emoteLoadStatus,
    messages$,
    processedMessageIdsRef,
    reprocessKey,
    userLogin,
  }: {
    channelId: string;
    emoteLoadStatus: string;
    messages$: { peek: () => AnyChatMessageType[] };
    processedMessageIdsRef: RefObject<Set<string>>;
    reprocessKey: string;
    userLogin?: string | null;
  }) => {
    const channelEmoteData = useChannelEmoteDataForReprocess(channelId);
    const emojiStyle = usePreference('emojiStyle');
    const show7TvEmotes = usePreference('show7TvEmotes');

    useEffect(() => {
      chatStore$.emojis.set(getEmojiEmotes(emojiStyle));
    }, [emojiStyle]);

    useEmoteReprocessing({
      channelId,
      channelEmoteData,
      messages$,
      emoteLoadStatus,
      processedMessageIdsRef,
      reprocessKey,
      show7TvEmotes,
      userLogin,
    });

    return null;
  },
);
