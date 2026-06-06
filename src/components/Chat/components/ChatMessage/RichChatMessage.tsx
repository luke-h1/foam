/* eslint-disable camelcase */
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import { memo } from 'react';

import { EmoteActionSheet } from './renderers/EmoteActionSheet';
import type { RichChatMessageProps } from './RichChatMessage.types';
import {
  RichChatMessageBody,
  RichChatMessageContainer,
} from './RichChatMessageBody';
import { useRichChatMessage } from './useRichChatMessage';

export type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './RichChatMessage.types';

function ChatMessageComponent<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>(props: RichChatMessageProps<TNoticeType, TVariant>) {
  const state = useRichChatMessage(props);

  return (
    <>
      <RichChatMessageContainer state={state}>
        <RichChatMessageBody {...state} />
      </RichChatMessageContainer>
      {state.selectedEmoteAction ? (
        <EmoteActionSheet
          disableAnimations={state.disableEmoteAnimations}
          isPresented
          onDismiss={state.closeEmoteActionSheet}
          onPress={state.handleEmotePress}
          part={state.selectedEmoteAction}
        />
      ) : null}
    </>
  );
}

/** memo() erases generics; one cast restores the component's type signature. */
export const RichChatMessage = memo(
  ChatMessageComponent,
) as unknown as typeof ChatMessageComponent;
