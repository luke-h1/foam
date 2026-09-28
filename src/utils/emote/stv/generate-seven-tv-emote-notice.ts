/* eslint-disable camelcase */
import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { MessageToken } from '@app/utils/chat/message-token';
import { generateNonce } from '@app/utils/string/generate-nonce';

interface GenerateStvEmoteNoticeArgs {
  type: 'added' | 'removed';
  emote: SanitisedEmote;
  channelName: string;
}

export function generateStvEmoteNotice({
  channelName,
  emote,
  type,
}: GenerateStvEmoteNoticeArgs): ChatMessageType<never, never> {
  const message_id = generateNonce();
  const message_nonce = generateNonce();
  const id = `${message_id}_${message_nonce}`;

  const userstate: UserStateTags = {
    'reply-parent-msg-id': '',
    'reply-parent-msg-body': '',
    'reply-parent-display-name': '',
    'reply-parent-user-login': '',
  };

  const tail = {
    badges: [],
    channel: channelName,
    message_id,
    message_nonce,
    parentDisplayName: '',
    replyBody: '',
    replyDisplayName: '',
    sender: '',
    isSpecialNotice: true,
  };

  if (type === 'removed') {
    return {
      id,
      userstate,
      message: [
        {
          type: 'stvEmoteRemoved',
          stvEvents: {
            data: emote,
            type: 'removed',
          },
        } satisfies MessageToken<'stvEmoteRemoved'>,
      ],
      ...tail,
    };
  }

  return {
    id,
    userstate,
    message: [
      {
        type: 'stvEmoteAdded',
        stvEvents: {
          data: emote,
          type: 'added',
        },
      } satisfies MessageToken<'stvEmoteAdded'>,
    ],
    ...tail,
  };
}
