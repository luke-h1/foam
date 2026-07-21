import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { ReactNode } from 'react';
import type { Key } from 'react';

import { MediaLinkCard } from '@app/components/Chat/components/MediaLinkCard';
import { StvEmoteEvent } from '@app/components/Chat/components/StvEmoteEvent';
import { SubscriptionNotice } from '@app/components/Chat/components/usernotices/SubscriptionNotice';
import { ViewerMileStoneNoticeComponent } from '@app/components/Chat/components/usernotices/ViewerMilestoneNotice';
import { Text } from '@app/components/ui/Text/Text';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';

import {
  type ChatFontScale,
  getChatFontScaleStyle,
  getRichChatMessageStyles,
} from '../RichChatMessage.styles';
import type { EmotePressData } from '../RichChatMessage.types';
import { CheermoteRenderer } from './CheermoteRenderer';
import { EmoteRenderer } from './EmoteRenderer';
import { MentionSpan } from './MentionSpan';

export interface UseChatMessagePartRendererArgs {
  compact: boolean;
  disableEmoteAnimations: boolean;
  fontScale?: ChatFontScale;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  getMentionColor?: (username: string) => string;
  getPartKey: (part: ParsedPart, index: number) => Key;
  onEmoteTouchStart?: (part: EmotePressData) => void;
  message: ParsedPart[];
  moderationNotice?: unknown;
  normalisedCurrentUsername?: string;
  noticeTags?: UserNoticeTags;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  replyPlainMentionTarget?: string;
  emoteTargetSize?: number;
  textColor?: string;
}

export function useChatMessagePartRenderer({
  compact,
  disableEmoteAnimations,
  fontScale,
  effectiveHighlightedUserSet,
  getMentionColor,
  getPartKey,
  onEmoteTouchStart,
  message,
  moderationNotice,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
}: UseChatMessagePartRendererArgs) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const styles = getRichChatMessageStyles(scheme);
  const mentionBaseTextStyle = useMemo(
    () => [
      styles.messageText,
      compact && styles.messageTextCompact,
      getChatFontScaleStyle(fontScale, compact),
      Boolean(moderationNotice) && styles.moderatedMessageText,
    ],
    [styles, compact, fontScale, moderationNotice],
  );

  const renderMessagePart = (part: ParsedPart, index: number): ReactNode => {
    switch (part.type) {
      case 'text': {
        const content = getParsedPartStringContent(part);
        if (!content.trim()) {
          return null;
        }

        return (
          <Text
            key={getPartKey(part, index)}
            color='gray.text'
            style={[
              styles.messageText,
              compact && styles.messageTextCompact,
              getChatFontScaleStyle(fontScale, compact),
              Boolean(moderationNotice) && styles.moderatedMessageText,
            ]}
          >
            {content}
          </Text>
        );
      }

      case 'stvEmote': {
        const content = getParsedPartStringContent(part);
        if (!content.trim()) {
          return null;
        }

        return (
          <MediaLinkCard
            key={getPartKey(part, index)}
            layout='inline'
            thumbnail={part.thumbnail}
            type='stvEmote'
            url={content}
          />
        );
      }

      case 'twitchClip': {
        const content = getParsedPartStringContent(part);
        if (!content.trim()) {
          return null;
        }

        return (
          <MediaLinkCard
            key={getPartKey(part, index)}
            thumbnail={part.thumbnail}
            type='twitchClip'
            url={content}
          />
        );
      }

      case 'link': {
        const content = getParsedPartStringContent(part);
        if (!content.trim()) {
          return null;
        }

        return (
          <Text
            key={getPartKey(part, index)}
            style={[
              styles.messageLink,
              compact && styles.messageLinkCompact,
              getChatFontScaleStyle(fontScale, compact),
              Boolean(moderationNotice) && styles.moderatedMessageText,
            ]}
          >
            {content}
          </Text>
        );
      }

      case 'emote': {
        const previousPart = message[index - 1];
        const shouldOverlayPrevious =
          Boolean(part.zero_width) && previousPart?.type === 'emote';

        return (
          <EmoteRenderer
            disableAnimations={disableEmoteAnimations}
            key={getPartKey(part, index)}
            part={part}
            onEmoteTouchStart={onEmoteTouchStart}
            shouldOverlayPrevious={shouldOverlayPrevious}
            targetSize={emoteTargetSize ?? (compact ? 26 : 30)}
          />
        );
      }

      case 'cheermote': {
        return (
          <CheermoteRenderer
            disableAnimations={disableEmoteAnimations}
            isModerated={Boolean(moderationNotice)}
            key={getPartKey(part, index)}
            part={part}
            targetSize={emoteTargetSize ?? (compact ? 26 : 30)}
          />
        );
      }

      case 'mention': {
        return (
          <MentionSpan
            key={getPartKey(part, index)}
            content={getParsedPartStringContent(part)}
            baseTextStyle={mentionBaseTextStyle}
            fontScaleStyle={getChatFontScaleStyle(fontScale, compact)}
            compact={compact}
            isModerated={Boolean(moderationNotice)}
            getMentionColor={getMentionColor}
            effectiveHighlightedUserSet={effectiveHighlightedUserSet}
            normalisedCurrentUsername={normalisedCurrentUsername}
            replyPlainMentionTarget={replyPlainMentionTarget}
          />
        );
      }

      case 'stv_emote_added':
      case 'stv_emote_removed': {
        return (
          <StvEmoteEvent
            key={getPartKey(part, index)}
            disableAnimations={disableEmoteAnimations}
            part={part}
          />
        );
      }

      case 'sub':
      case 'resub':
      case 'submysterygift':
      case 'giftpaidupgrade':
      case 'anongiftpaidupgrade':
      case 'anongift': {
        const subMessage = part.subscriptionEvent?.message;
        const parsedSubMessage =
          subMessage && parseTextForEmotes
            ? parseTextForEmotes(subMessage)
            : undefined;

        if (noticeTags) {
          return (
            <SubscriptionNotice
              key={getPartKey(part, index)}
              part={part}
              notice_tags={noticeTags}
              parsedMessage={parsedSubMessage}
            />
          );
        }

        return (
          <SubscriptionNotice
            key={getPartKey(part, index)}
            part={part}
            parsedMessage={parsedSubMessage}
          />
        );
      }

      case 'viewermilestone': {
        return (
          <ViewerMileStoneNoticeComponent
            key={getPartKey(part, index)}
            part={part}
          />
        );
      }

      default:
        return null;
    }
  };

  const isRaidNotice =
    noticeTags?.['msg-id'] === 'raid' || noticeTags?.['msg-id'] === 'unraid';

  const renderSystemMessagePart = (
    part: ParsedPart,
    index: number,
  ): ReactNode => {
    if (part.type === 'text') {
      const content = getParsedPartStringContent(part);
      if (!content.trim()) {
        return null;
      }

      return (
        <Text
          key={getPartKey(part, index)}
          style={[
            isRaidNotice ? styles.raidNoticeText : styles.systemMessageText,
            compact && isRaidNotice && styles.messageMetaTextCompact,
          ]}
        >
          {content}
        </Text>
      );
    }

    return renderMessagePart(part, index);
  };

  return { renderMessagePart, renderSystemMessagePart };
}
