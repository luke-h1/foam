import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { ChatMessageType } from '@app/store/chatStore';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { generateNonce } from '@app/utils/string/generateNonce';

interface GenerateStvEmoteNoticeArgs {
  type: 'added' | 'removed';
  emote: SanitisiedEmoteSet;
  channelName: string;
}

export function generateStvEmoteNotice({
  channelName,
  emote,
  type,
}: GenerateStvEmoteNoticeArgs): ChatMessageType<never, never> {
  console.log('type');
  if (type === 'removed') {
    return {
      userstate: {
        'reply-parent-msg-id': '',
        'reply-parent-msg-body': '',
        'reply-parent-display-name': '',
        'reply-parent-user-login': '',
      },
      message: [
        {
          type: 'stv_emote_removed',
          stvEvents: {
            data: emote,
            type: 'removed',
          },
        } satisfies ParsedPart<'stv_emote_removed'>,
      ],
      badges: [],
      channel: channelName,
      message_id: generateNonce(),
      message_nonce: generateNonce(),
      parentDisplayName: '',
      replyBody: '',
      replyDisplayName: '',
      sender: '',
    };
  }

  if (type === 'added') {
    return {
      userstate: {
        'reply-parent-msg-id': '',
        'reply-parent-msg-body': '',
        'reply-parent-display-name': '',
        'reply-parent-user-login': '',
      },
      message: [
        {
          type: 'stv_emote_added',
          stvEvents: {
            data: emote,
            type: 'added',
          },
        } satisfies ParsedPart<'stv_emote_added'>,
      ],
      badges: [],
      channel: channelName,
      message_id: generateNonce(),
      message_nonce: generateNonce(),
      parentDisplayName: '',
      replyBody: '',
      replyDisplayName: '',
      sender: '',
    };
  }
  return new Error("type wasn't `removed` or `added`") as never;
}
