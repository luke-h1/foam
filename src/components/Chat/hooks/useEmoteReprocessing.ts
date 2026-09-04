import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import {
  enrichMessageSet,
  hasEnrichmentEmoteSources,
} from '@app/store/chat/actions/messageEnrichment';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';

const MAX_PROCESSED_MESSAGE_IDS = 5000;

export function useEmoteReprocessing({
  channelId,
  channelEmoteData,
  messages$,
  emoteLoadStatus,
  processedMessageIdsRef,
  reprocessKey,
  show7TvEmotes,
  userLogin,
}: {
  channelId: string;
  channelEmoteData: unknown;
  messages$: { peek: () => AnyChatMessageType[] };
  emoteLoadStatus: string;
  processedMessageIdsRef: RefObject<Set<string>>;
  reprocessKey?: string;
  show7TvEmotes: boolean;
  userLogin?: string | null;
}) {
  const previousReprocessKeyRef = useRef(reprocessKey);

  useEffect(() => {
    if (previousReprocessKeyRef.current !== reprocessKey) {
      processedMessageIdsRef.current.clear();
      previousReprocessKeyRef.current = reprocessKey;
    } else if (
      processedMessageIdsRef.current.size > MAX_PROCESSED_MESSAGE_IDS
    ) {
      processedMessageIdsRef.current.clear();
    }

    if (emoteLoadStatus !== 'success') {
      return;
    }

    const emoteData = getCurrentEmoteData(channelId);

    if (
      !hasEnrichmentEmoteSources(emoteData, {
        includePersonalEmotes: show7TvEmotes,
      })
    ) {
      return;
    }

    const currentMessages = messages$.peek();

    if (currentMessages.length === 0) {
      return;
    }

    return enrichMessageSet({
      channelId,
      emoteData,
      messages: currentMessages,
      processedMessageIds: processedMessageIdsRef.current,
      show7TvEmotes,
      userLogin,
    });
  }, [
    channelId,
    channelEmoteData,
    messages$,
    emoteLoadStatus,
    processedMessageIdsRef,
    reprocessKey,
    show7TvEmotes,
    userLogin,
  ]);
}
