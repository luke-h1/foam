import { useMemo } from 'react';

import { StvEmoteEvent } from '@app/components/chat/components/StvEmoteEvent';
import type { MessageToken } from '@app/utils/chat/messageToken';
import { getMessageTokenText } from '@app/utils/chat/messageTokenContent';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { densityFromCompact, getChatScale } from '../util/chatScale';
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
  compact,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  fontScale,
  getMentionColor,
  getTokenKey,
  onEmoteTouchStart,
  index,
  message,
  mode,
  moderationNotice,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
  textColor,
  token,
}: ChatMessageTokenProps) {
  const isModerated = Boolean(moderationNotice);
  const textStyles = getChatTextStyles(fontScale, compact);
  const scale = getChatScale(fontScale, densityFromCompact(compact));
  const resolvedEmoteSize = emoteTargetSize ?? scale.emoteSize;

  const mentionBaseTextStyle = useMemo(
    () => [textStyles.body, isModerated && styles.moderatedMessageText],
    [textStyles, isModerated],
  );

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
          key={getTokenKey(token, index)}
          isModerated={isModerated}
          textColor={textColor}
          textStyles={textStyles}
          token={token}
        />
      );

    case 'stvEmoteLink':
    case 'twitchClip':
      return <MediaLinkToken key={getTokenKey(token, index)} token={token} />;

    case 'emote': {
      const previousToken = message[index - 1];

      const shouldOverlayPrevious =
        Boolean(token.zero_width) && previousToken?.type === 'emote';

      return (
        <EmoteToken
          {...{
            disableAnimations: disableEmoteAnimations,
            isModerated,
            key: getTokenKey(token, index),
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
          key={getTokenKey(token, index)}
          textStyles={textStyles}
          token={token}
          targetSize={resolvedEmoteSize}
        />
      );

    case 'mention': {
      return (
        <MentionToken
          {...{
            key: getTokenKey(token, index),
            content: getMessageTokenText(token),
            baseTextStyle: mentionBaseTextStyle,
            compact,
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
          key={getTokenKey(token, index)}
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          token={token}
        />
      );

    case 'gif':
      return (
        <GifToken
          disableAnimations={disableEmoteAnimations}
          isModerated={isModerated}
          key={getTokenKey(token, index)}
          textStyles={textStyles}
          token={token}
          targetSize={scale.gifSize}
        />
      );

    default:
      return (
        <NoticeToken
          key={getTokenKey(token, index)}
          compact={compact}
          disableEmoteAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          noticeTags={noticeTags}
          parseTextForEmotes={parseTextForEmotes}
          token={token}
        />
      );
  }
}
