import { Text } from '@app/components/ui/Text/Text';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { useCallback, type Key, type ReactNode } from 'react';
import { MediaLinkCard } from '../../MediaLinkCard';
import { StvEmoteEvent } from '../../StvEmoteEvent';
import { SubscriptionNotice } from '../../usernotices/SubscriptionNotice';
import { ViewerMileStoneNoticeComponent } from '../../usernotices/ViewerMilestoneNotice';
import { styles } from '../RichChatMessage.styles';
import type { EmotePressData } from '../RichChatMessage.types';
import { normaliseUsername } from '../richChatMessageUtils';
import { EmoteRenderer } from './EmoteRenderer';

interface UseChatMessagePartRendererArgs {
  compact: boolean;
  disableEmoteAnimations: boolean;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  getMentionColor?: (username: string) => string;
  getPartKey: (part: ParsedPart, index: number) => Key;
  handleEmotePress: (part: EmotePressData) => void;
  message: ParsedPart[];
  moderationNotice?: unknown;
  normalisedCurrentUsername?: string;
  noticeTags?: UserNoticeTags;
  parseTextForEmotes?: (text: string) => ParsedPart[];
}

export function useChatMessagePartRenderer({
  compact,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  getMentionColor,
  getPartKey,
  handleEmotePress,
  message,
  moderationNotice,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
}: UseChatMessagePartRendererArgs) {
  const renderMessagePart = useCallback(
    (part: ParsedPart, index: number): ReactNode => {
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

        case 'emote': {
          const previousPart = message[index - 1];
          const shouldOverlayPrevious =
            Boolean(part.zero_width) && previousPart?.type === 'emote';

          return (
            <EmoteRenderer
              disableAnimations={disableEmoteAnimations}
              key={getPartKey(part, index)}
              part={part}
              handleEmotePress={handleEmotePress}
              shouldOverlayPrevious={shouldOverlayPrevious}
              targetSize={compact ? 22 : 26}
            />
          );
        }

        case 'mention': {
          const mentionedUsername = part.content.replace(/^@/, '').trim();
          const normalisedMentionedUsername =
            normaliseUsername(mentionedUsername);
          const mentionColor = getMentionColor
            ? getMentionColor(mentionedUsername)
            : generateRandomTwitchColor(mentionedUsername);
          const isHighlightedMention =
            effectiveHighlightedUserSet?.has(normalisedMentionedUsername) ||
            normalisedCurrentUsername === normalisedMentionedUsername;

          return (
            <Text key={getPartKey(part, index)}>
              <Text
                style={[
                  styles.mention,
                  styles.mentionDefaultColor,
                  compact && styles.mentionCompact,
                  isHighlightedMention && styles.mentionHighlighted,
                  mentionColor && { color: mentionColor },
                ]}
              >
                {part.content}
              </Text>
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
    },
    [
      compact,
      disableEmoteAnimations,
      effectiveHighlightedUserSet,
      getMentionColor,
      getPartKey,
      handleEmotePress,
      message,
      moderationNotice,
      normalisedCurrentUsername,
      noticeTags,
      parseTextForEmotes,
    ],
  );

  const renderSystemMessagePart = useCallback(
    (part: ParsedPart, index: number): ReactNode => {
      if (part.type === 'text') {
        return (
          <Text key={getPartKey(part, index)} style={styles.systemMessageText}>
            {part.content}
          </Text>
        );
      }

      return renderMessagePart(part, index);
    },
    [getPartKey, renderMessagePart],
  );

  return { renderMessagePart, renderSystemMessagePart };
}
