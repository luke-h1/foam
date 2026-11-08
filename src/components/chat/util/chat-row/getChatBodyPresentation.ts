import { hasSharedChannelPointsMessage } from '@app/components/chat/util/channelPointsSharedMessage';
import type { CustomHighlight } from '@app/types/chat/customHighlight';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { MessageToken } from '@app/types/chat/messageToken';
import { findCustomHighlight } from '@app/utils/chat/custom-highlights/findCustomHighlight';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';

interface GetChatBodyPresentationOptions {
  customHighlights: CustomHighlight[] | undefined;
  detectedBodyVariant: ChatBodyVariant;
  isChannelPointRedemption: boolean;
  isHighlightedMessage: boolean;
  isModerated: boolean;
  message: MessageToken[];
  noticeMsgId: string | undefined;
  userstate: UserStateTags;
}

export function getChatBodyPresentation({
  customHighlights,
  detectedBodyVariant,
  isChannelPointRedemption,
  isHighlightedMessage,
  isModerated,
  message,
  noticeMsgId,
  userstate,
}: GetChatBodyPresentationOptions) {
  const customHighlight =
    detectedBodyVariant === 'user_chat' &&
    !isModerated &&
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
