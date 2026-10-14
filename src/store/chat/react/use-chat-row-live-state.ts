import { useEffect, useMemo, useState } from 'react';

import { useSelector } from '@legendapp/state/react';

import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { chatStore$ } from '../observables/chat-store';
import { chatTransientState$ } from '../observables/chat-transient-state';
import { rewardTitleRevision$ } from '../observables/reward-title-revision';

/**
 * The store values a chat row reads after its message arrived. React rows
 * subscribe to each one per row; the native list reads them once for the
 * whole list.
 */
export interface ChatRowLiveState {
  /**
   * Bumps on every paint or paint binding change. The two maps change in
   * place, so their identity does not show a change.
   */
  cosmeticsRevision: number;
  highlightedReplyTargetId: string | null;
  mentionLoginRevision: number;
  paints: Record<string, PaintData>;
  rewardTitleRevision: number;
  userPaintIds: Record<string, string>;
}

export function useChatRowLiveState(channelId: string): ChatRowLiveState {
  const [cosmeticsRevision, setCosmeticsRevision] = useState(0);

  useEffect(() => {
    const bump = () => setCosmeticsRevision(revision => revision + 1);
    const disposePaintIds = chatStore$.userPaintIds.onChange(bump);
    const disposePaints = chatStore$.paints.onChange(bump);

    return () => {
      disposePaintIds();
      disposePaints();
    };
  }, []);

  const highlightedReplyTargetId = useSelector(
    () =>
      chatTransientState$[channelId]?.highlightedReplyTargetMessageId.get() ??
      null,
  );

  const mentionLoginRevision = useSelector(chatStore$.mentionLoginRevision);
  const rewardTitleRevision = useSelector(rewardTitleRevision$);

  return useMemo(
    () => ({
      cosmeticsRevision,
      highlightedReplyTargetId,
      mentionLoginRevision,
      paints: chatStore$.paints.peek(),
      rewardTitleRevision,
      userPaintIds: chatStore$.userPaintIds.peek(),
    }),
    [
      cosmeticsRevision,
      highlightedReplyTargetId,
      mentionLoginRevision,
      rewardTitleRevision,
    ],
  );
}
