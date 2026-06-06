import type { ReactNode } from 'react';
import type { Key } from 'react';

import { Text } from '@app/components/ui/Text/Text';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { formatMentionContent } from '@app/utils/chat/resolveMentionLogin';
import { MediaLinkCard } from '../../MediaLinkCard';
import { StvEmoteEvent } from '../../StvEmoteEvent';
import { SubscriptionNotice } from '../../usernotices/SubscriptionNotice';
import { ViewerMileStoneNoticeComponent } from '../../usernotices/ViewerMilestoneNotice';
import { styles } from '../RichChatMessage.styles';
import type { EmotePressData } from '../RichChatMessage.types';
import { normaliseUsername } from '../richChatMessageHelpers';
import { EmoteRenderer } from './EmoteRenderer';

export interface UseChatMessagePartRendererArgs {
  compact: boolean;
  disableEmoteAnimations: boolean;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  getMentionColor?: (username: string) => string;
  getPartKey: (part: ParsedPart, index: number) => Key;
  handleEmoteLongPress?: (part: EmotePressData) => void;
  message: ParsedPart[];
  moderationNotice?: unknown;
  normalisedCurrentUsername?: string;
  noticeTags?: UserNoticeTags;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  replyPlainMentionTarget?: string;
  emoteTargetSize?: number;
}

export function useChatMessagePartRenderer({
  compact,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  getMentionColor,
  getPartKey,
  handleEmoteLongPress,
  message,
  moderationNotice,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
}: UseChatMessagePartRendererArgs) {
  const renderMessagePart = (part: ParsedPart, index: number): ReactNode => {
    switch (part.type) {
      case 'text': {
        return (
          <Text
            key={getPartKey(part, index)}
            color='gray.text'
            style={[
              styles.messageText,
              compact && styles.messageTextCompact,
              Boolean(moderationNotice) && styles.moderatedMessageText,
            ]}
          >
            {part.content}
          </Text>
        );
      }

      case 'stvEmote': {
        return (
          <MediaLinkCard
            key={getPartKey(part, index)}
            layout='inline'
            type='stvEmote'
            url={part.content}
          />
        );
      }

      case 'twitchClip': {
        return (
          <MediaLinkCard
            key={getPartKey(part, index)}
            type='twitchClip'
            url={part.content}
          />
        );
      }

      case 'link': {
        return (
          <Text
            key={getPartKey(part, index)}
            style={[
              styles.messageLink,
              compact && styles.messageLinkCompact,
              Boolean(moderationNotice) && styles.moderatedMessageText,
            ]}
          >
            {part.content}
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
            handleEmoteLongPress={handleEmoteLongPress}
            shouldOverlayPrevious={shouldOverlayPrevious}
            targetSize={emoteTargetSize ?? (compact ? 26 : 30)}
          />
        );
      }

      case 'mention': {
        const mentionContent = formatMentionContent(part.content);
        const mentionedUsername = mentionContent.replace(/^@/, '').trim();
        const normalisedMentionedUsername =
          normaliseUsername(mentionedUsername);
        const isReplyTargetMention = Boolean(
          replyPlainMentionTarget &&
          normalisedMentionedUsername === replyPlainMentionTarget,
        );

        if (isReplyTargetMention) {
          return (
            <Text
              key={getPartKey(part, index)}
              color='gray.text'
              style={[
                styles.messageText,
                compact && styles.messageTextCompact,
                Boolean(moderationNotice) && styles.moderatedMessageText,
              ]}
            >
              {mentionContent}
            </Text>
          );
        }
        const mentionColor = getMentionColor
          ? getMentionColor(mentionedUsername)
          : generateRandomTwitchColor(mentionedUsername);
        const isHighlightedMention =
          effectiveHighlightedUserSet?.has(normalisedMentionedUsername) ||
          normalisedCurrentUsername === normalisedMentionedUsername;

        return (
          <Text
            key={getPartKey(part, index)}
            style={[
              styles.mention,
              compact && styles.mentionCompact,
              isHighlightedMention && styles.mentionHighlighted,
              { color: mentionColor },
              Boolean(moderationNotice) && styles.moderatedMessageText,
            ]}
          >
            {mentionContent}
          </Text>
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
      return (
        <Text
          key={getPartKey(part, index)}
          style={[
            isRaidNotice ? styles.raidNoticeText : styles.systemMessageText,
            compact && isRaidNotice && styles.messageMetaTextCompact,
          ]}
        >
          {part.content}
        </Text>
      );
    }

    return renderMessagePart(part, index);
  };

  return { renderMessagePart, renderSystemMessagePart };
}
