import { useChannelEmoteData } from '@app/store/chatStore/hooks';
import type { AnyChatMessageType } from '@app/store/chatStore/constants';
import { RefObject, memo } from 'react';

import { useEmoteReprocessing } from '../hooks/useEmoteReprocessing';

export const ChatEmoteReprocessor = memo(
  ({
    channelId,
    emoteLoadStatus,
    messages$,
    processedMessageIdsRef,
    reprocessKey,
  }: {
    channelId: string;
    emoteLoadStatus: string;
    messages$: { peek: () => AnyChatMessageType[] };
    processedMessageIdsRef: RefObject<Set<string>>;
    reprocessKey: string;
  }) => {
    const channelEmoteData = useChannelEmoteData(channelId);

    useEmoteReprocessing({
      channelId,
      channelEmoteData,
      messages$,
      emoteLoadStatus,
      processedMessageIdsRef,
      reprocessKey,
    });

    return null;
  },
);
