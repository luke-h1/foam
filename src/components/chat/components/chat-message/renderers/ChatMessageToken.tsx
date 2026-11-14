import { StvEmoteEvent } from '@app/components/chat/components/StvEmoteEvent';
import { getTokenIdentity } from '@app/components/chat/util/chat-row/getTokenIdentity';
import type { MessageToken } from '@app/types/chat/messageToken';
import { getMessageTokenText } from '@app/utils/chat/messageTokenContent';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { getChatRowTextStyle } from '../util/chatRowTextStyle';
import { getChatScale } from '../util/chatScale';
import { CheermoteToken } from './CheermoteToken';
import { EmoteToken } from './EmoteToken';
import { GifToken } from './GifToken';
import { MediaLinkToken } from './MediaLinkToken';
import { MentionToken } from './MentionToken';
import { NoticeToken } from './NoticeToken';
import { SystemTextToken } from './SystemTextToken';
import { TextToken } from './TextToken';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

type ChatMessageTokenProps = Omit<ChatTokenRenderProps, 'message'> & {
  index: number;
  message: MessageToken[];
  mode: 'message' | 'system';
  token: MessageToken;
};

export function ChatMessageToken({
  density,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  fontScale,
  getMentionColor,
  onEmoteTouchStart,
  index,
  message,
  mode,
  isModerated,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
  textColor,
  token,
}: ChatMessageTokenProps) {
  const textStyles = getChatTextStyles(fontScale, density);
  const scale = getChatScale(fontScale, density);
  const resolvedEmoteSize = emoteTargetSize ?? scale.emoteSize;

  const systemContent =
    mode === 'system' && token.type === 'text'
      ? getMessageTokenText(token)
      : null;

  if (systemContent !== null) {
    return (
      <SystemTextToken
        content={systemContent}
        noticeTags={noticeTags}
        textStyles={textStyles}
      />
    );
  }

  switch (token.type) {
    case 'text':
    case 'link':
      return (
        <TextToken
          key={getTokenIdentity(token, index)}
          isModerated={isModerated}
          textColor={textColor}
          textStyles={textStyles}
          token={token}
        />
      );

    case 'stvEmoteLink':
    case 'twitchClip':
      return (
        <MediaLinkToken key={getTokenIdentity(token, index)} token={token} />
      );

    case 'emote': {
      const previousToken = message[index - 1];

      const shouldOverlayPrevious =
        Boolean(token.zero_width) && previousToken?.type === 'emote';

      return (
        <EmoteToken
          key={getTokenIdentity(token, index)}
          {...{
            disableAnimations: disableEmoteAnimations,
            isModerated,
            token,
            onEmoteTouchStart,
            shouldOverlayPrevious,
            targetSize: resolvedEmoteSize,
          }}
        />
      );
    }

    case 'cheermote':
      return (
        <CheermoteToken
          disableAnimations={disableEmoteAnimations}
          isModerated={isModerated}
          key={getTokenIdentity(token, index)}
          textStyles={textStyles}
          token={token}
          targetSize={resolvedEmoteSize}
        />
      );

    case 'mention': {
      return (
        <MentionToken
          key={getTokenIdentity(token, index)}
          {...{
            content: getMessageTokenText(token),
            baseRowTextStyle: getChatRowTextStyle(
              'text',
              textStyles.body,
              isModerated && styles.moderatedMessageText,
            ),
            density,
            fontScale,
            isModerated,
            getMentionColor,
            effectiveHighlightedUserSet,
            normalisedCurrentUsername,
            replyPlainMentionTarget,
          }}
        />
      );
    }

    case 'stvEmoteAdded':
    case 'stvEmoteRemoved':
      return (
        <StvEmoteEvent
          key={getTokenIdentity(token, index)}
          density={density}
          disableEmoteAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          token={token}
        />
      );

    case 'gif':
      return (
        <GifToken
          disableAnimations={disableEmoteAnimations}
          isModerated={isModerated}
          key={getTokenIdentity(token, index)}
          textStyles={textStyles}
          token={token}
          targetSize={scale.gifSize}
        />
      );

    default:
      return (
        <NoticeToken
          key={getTokenIdentity(token, index)}
          density={density}
          disableEmoteAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parseTextForEmotes={parseTextForEmotes}
          token={token}
        />
      );
  }
}
