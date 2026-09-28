import { hasSharedChannelPointsMessage } from '@app/components/chat/util/channel-points-shared-message';
import type { CustomHighlight } from '@app/store/preference-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { findCustomHighlight } from '@app/utils/chat/custom-highlights/find-custom-highlight';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';
import type { MessageToken } from '@app/utils/chat/message-token';

interface GetChatBodyPresentationOptions {
  customHighlights: CustomHighlight[] | undefined;
  detectedBodyVariant: ChatBodyVariant;
  isChannelPointRedemption: boolean;
  isHighlightedMessage: boolean;
  message: MessageToken[];
  moderationNotice: unknown;
  noticeMsgId: string | undefined;
  userstate: UserStateTags;
}

/**
 * Turns the detected body variant into what the row actually draws: the raid
 * variant, the matched custom highlight, and the channel-points chrome flag.
 */
export function getChatBodyPresentation({
  customHighlights,
  detectedBodyVariant,
  isChannelPointRedemption,
  isHighlightedMessage,
  message,
  moderationNotice,
  noticeMsgId,
  userstate,
}: GetChatBodyPresentationOptions) {
  const customHighlight =
    detectedBodyVariant === 'user_chat' &&
    !moderationNotice &&
    customHighlights &&
    customHighlights.length > 0
      ? findCustomHighlight(message, customHighlights)
      : undefined;

  const bodyVariant =
    detectedBodyVariant === 'twitch_system_notice' &&
    (noticeMsgId === 'raid' || noticeMsgId === 'unraid')
      ? 'raid'
      : detectedBodyVariant;

  const isUserChat = bodyVariant === 'user_chat';

  return {
    bodyVariant,
    customHighlightColor: customHighlight?.color,
    isAppSystemSender: bodyVariant === 'app_system_sender',
    isUserChat,
    showChannelPointsRewardChrome: Boolean(
      isUserChat &&
      userstate.username &&
      (isHighlightedMessage ||
        (isChannelPointRedemption && hasSharedChannelPointsMessage(message))),
    ),
  };
}
