/* eslint-disable camelcase */
import { memo } from 'react';

import { useChatRow } from '@app/components/chat/hooks/use-chat-row';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';

import type { ChatRowProps } from './chat-row.types';
import { ChatRowBody } from './chat-row-body';
import { ChatRowSurface } from './chat-row-surface';
import { EmoteActionSheet } from './renderers/emote-action-sheet';

export type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './chat-row.types';

function ChatRowComponent<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
>(props: ChatRowProps<TNoticeType, TVariant>) {
  const state = useChatRow(props);

  return (
    <>
      <ChatRowSurface state={state}>
        <ChatRowBody {...state} />
      </ChatRowSurface>
      {state.selectedEmoteAction ? (
        <EmoteActionSheet
          disableAnimations={state.disableEmoteAnimations}
          isPresented
          onDismiss={state.closeEmoteActionSheet}
          onPress={state.handleEmotePress}
          token={state.selectedEmoteAction}
        />
      ) : null}
    </>
  );
}

/**
 * memo() erases generics; one cast restores the component's type signature.
 */
export const ChatRow =
  // SAFETY: memo forwards the same props to ChatRowComponent, so the wrapper keeps its call signature.
  memo(ChatRowComponent) as typeof ChatRowComponent;
