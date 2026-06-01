import { useChannelEmoteData } from '@app/store/chatStore/hooks';
import { memo, RefObject } from 'react';

import { useEmoteReprocessing } from '../hooks/useEmoteReprocessing';

export const ChatEmoteRuntime = memo(
  ({
    channelId,
    emoteLoadStatus,
    messages$,
    processedMessageIdsRef,
    reprocessKey,
  }: {
    channelId: string;
    emoteLoadStatus: string;
    messages$: { peek: () => unknown[] };
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

ChatEmoteRuntime.displayName = 'ChatEmoteRuntime';
