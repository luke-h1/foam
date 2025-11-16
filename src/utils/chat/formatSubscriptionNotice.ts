import { ChatMessageType } from '@app/context';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { generateNonce } from '@app/utils/string/generateNonce';

interface FormatSubscriptionNoticeParams {
  channel: string;
  tags: Record<string, string>;
  message?: string;
}

/**
 * Formats a USERNOTICE message (subscription events) into a ChatMessageType
 */
export function formatSubscriptionNotice({
  channel,
  tags,
  message,
}: FormatSubscriptionNoticeParams): ChatMessageType<never, never> {
  const msgId = tags['msg-id'] || '';
  const displayName = tags['display-name'] || tags.login || 'Anonymous';
  const months = tags['msg-param-months']
    ? parseInt(tags['msg-param-months'], 10)
    : undefined;
  const plan = tags['msg-param-sub-plan'] || '';
  const recipientDisplayName = tags['msg-param-recipient-display-name'];
  const recipientId = tags['msg-param-recipient-id'];
  const giftMonths = tags['msg-param-gift-months']
    ? parseInt(tags['msg-param-gift-months'], 10)
    : undefined;
  const gifterDisplayName = tags['msg-param-gifter-display-name'];
  const gifterId = tags['msg-param-gifter-id'];
  const viewerCount = tags['msg-param-viewer-count']
    ? parseInt(tags['msg-param-viewer-count'], 10)
    : undefined;

  const getPlanName = (planCode: string): string | undefined => {
    switch (planCode) {
      case '1000':
        return 'Prime';
      case '2000':
        return 'Tier 1';
      case '3000':
        return 'Tier 2';
      case '3001':
        return 'Tier 3';
      default:
        return undefined;
    }
  };

  const subscriptionPart: ParsedPart<'twitch_subscription'> = {
    type: 'twitch_subscription',
    subscriptionEvent: {
      msgId,
      displayName,
      message: message || undefined,
      months,
      plan,
      planName: getPlanName(plan),
      recipientDisplayName,
      recipientId,
      giftMonths,
      viewerCount,
      gifterDisplayName,
      gifterId,
    },
  };

  return {
    userstate: {
      ...tags,
      username: displayName,
      login: tags.login || displayName.toLowerCase(),
      'reply-parent-msg-id': tags['reply-parent-msg-id'] || '',
      'reply-parent-msg-body': tags['reply-parent-msg-body'] || '',
      'reply-parent-display-name': tags['reply-parent-display-name'] || '',
      'reply-parent-user-login': tags['reply-parent-user-login'] || '',
    },

    message: [subscriptionPart],
    badges: [],
    channel,
    message_id: tags.id || generateNonce(),
    message_nonce: generateNonce(),
    sender: displayName,
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
  };
}
