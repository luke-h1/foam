/* eslint-disable camelcase */
import type { ChatMessageType } from '@app/store/chatStore/constants';
import type { SanitisedEmote } from '@app/types/emote';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
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
  const id = `${message_id}_${message_nonce}`;
  const userstate = {
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
          type: 'stv_emote_removed',
          stvEvents: {
            data: emote,
            type: 'removed',
          },
        } satisfies ParsedPart<'stv_emote_removed'>,
      ],
      ...tail,
    };
  }

  return {
    id,
    userstate,
    message: [
      {
        type: 'stv_emote_added',
        stvEvents: {
          data: emote,
          type: 'added',
        },
      } satisfies ParsedPart<'stv_emote_added'>,
    ],
    ...tail,
  };
}
