import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { ChatMessageType } from '@app/store';
import { ParsedPart } from '@app/utils/chat';
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
}: GenerateStvEmoteNoticeArgs): ChatMessageType<
  'stv_emote_added' | 'stv_emote_removed'
> {
  console.log('type');
  if (type === 'removed') {
    return {
      userstate: {},
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
      userstate: {},
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
  return new Error("type wasn't 'removed' or 'added'") as never;
}
