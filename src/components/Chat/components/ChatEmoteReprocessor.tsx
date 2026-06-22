import { memo, RefObject } from 'react';

import { useChannelEmoteData } from '@app/store/chat/react/selectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';

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
