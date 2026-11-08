import type { ChatMessageType } from '@app/types/chat/chatMessage';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedEmote } from '@app/types/emote';
import { getChatMessageKey } from '@app/utils/chat/message-identity/getChatMessageKey';
import { generateNonce } from '@app/utils/string/generateNonce';

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
  const id = getChatMessageKey(message_id, message_nonce);

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
    replyParentLogin: '',
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
