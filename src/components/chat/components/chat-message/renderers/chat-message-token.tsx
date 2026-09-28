import { useMemo } from 'react';

import { StvEmoteEvent } from '@app/components/chat/components/stv-emote-event';
import type { MessageToken } from '@app/utils/chat/message-token';
import { getMessageTokenText } from '@app/utils/chat/message-token-content';

import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import { densityFromCompact, getChatScale } from '../util/chat-scale';
import { CheermoteToken } from './cheermote-token';
import { EmoteToken } from './emote-token';
import { MediaLinkToken } from './media-link-token';
import { MentionToken } from './mention-token';
import { NoticeToken } from './notice-token';
import { SystemTextToken } from './system-text-token';
import { TextToken } from './text-token';
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
          disableAnimations={disableEmoteAnimations}
          isModerated={isModerated}
          key={getTokenKey(token, index)}
          token={token}
          onEmoteTouchStart={onEmoteTouchStart}
          shouldOverlayPrevious={shouldOverlayPrevious}
          targetSize={resolvedEmoteSize}
        />
      );
    }

    case 'cheermote':
      return (
        <CheermoteToken
          disableAnimations={disableEmoteAnimations}
          isModerated={isModerated}
          key={getTokenKey(token, index)}
          token={token}
          targetSize={resolvedEmoteSize}
        />
      );

    case 'mention': {
      return (
        <MentionToken
          key={getTokenKey(token, index)}
          content={getMessageTokenText(token)}
          baseTextStyle={mentionBaseTextStyle}
          compact={compact}
          fontScale={fontScale}
          isModerated={isModerated}
          getMentionColor={getMentionColor}
          effectiveHighlightedUserSet={effectiveHighlightedUserSet}
          normalisedCurrentUsername={normalisedCurrentUsername}
          replyPlainMentionTarget={replyPlainMentionTarget}
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
