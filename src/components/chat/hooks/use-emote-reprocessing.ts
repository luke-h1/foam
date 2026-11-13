import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import type { EmoteLoadingStatus } from '@app/components/chat/hooks/use-chat-emote-loader';
import type { ChatMessagesSource } from '@app/components/chat/types/chat-messages-source';
import {
  type ChannelEmoteDataSnapshot,
  type EmoteReprocessInputs,
  pickEmoteReprocessScope,
} from '@app/components/chat/util/pickEmoteReprocessScope';
import { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import {
  enrichMessageSet,
  type EnrichScope,
  hasEnrichmentEmoteSources,
} from '@app/store/chat/actions/message-enrichment';
import { takeSevenTvEmoteDelta } from '@app/store/chat/actions/seven-tv-emote-delta';

const MAX_PROCESSED_MESSAGE_IDS = 5000;

interface UseEmoteReprocessingOptions {
  channelId: string;
  channelEmoteData: ChannelEmoteDataSnapshot | null;
  messages$: ChatMessagesSource;
  emoteLoadStatus: EmoteLoadingStatus;
  processedMessageIdsRef: RefObject<Set<string>>;
  reprocessKey?: string;
  show7TvEmotes: boolean;
  showChatGifs: boolean;
  userLogin?: string | null;
}

export function useEmoteReprocessing({
  channelId,
  channelEmoteData,
  messages$,
  emoteLoadStatus,
  processedMessageIdsRef,
  reprocessKey,
  show7TvEmotes,
  showChatGifs = false,
  userLogin,
}: UseEmoteReprocessingOptions) {
  const previousReprocessKeyRef = useRef(reprocessKey);
  const previousShowChatGifsRef = useRef(showChatGifs);
  const previousInputsRef = useRef<EmoteReprocessInputs | null>(null);
  const runningPassRef = useRef<EnrichScope['kind'] | null>(null);

  useEffect(() => {
    const delta = takeSevenTvEmoteDelta(channelId);
    const previousInputs = previousInputsRef.current;

    const inputs: EmoteReprocessInputs = {
      channelId,
      channelEmoteData,
      emoteLoadStatus,
      show7TvEmotes,
      userLogin,
    };

    previousInputsRef.current = inputs;

    const reprocessKeyChanged =
      previousReprocessKeyRef.current !== reprocessKey;
    const showChatGifsChanged =
      previousShowChatGifsRef.current !== showChatGifs;

    if (reprocessKeyChanged || showChatGifsChanged) {
      processedMessageIdsRef.current.clear();
      previousReprocessKeyRef.current = reprocessKey;
      previousShowChatGifsRef.current = showChatGifs;
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

    const scope = pickEmoteReprocessScope({
      delta,
      previous: previousInputs,
      next: inputs,
      interruptedPass: runningPassRef.current,
      processedSetCleared: reprocessKeyChanged || showChatGifsChanged,
    });

    runningPassRef.current = scope.kind;

    return enrichMessageSet({
      channelId,
      emoteData,
      messages: currentMessages,
      onComplete: () => {
        runningPassRef.current = null;
      },
      processedMessageIds: processedMessageIdsRef.current,
      scope,
      show7TvEmotes,
      showChatGifs,
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
    showChatGifs,
    userLogin,
  ]);
}
