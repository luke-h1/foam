import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { formatMentionContent } from '@app/utils/chat/resolveMentionLogin';
import { MediaLinkCard } from '../../MediaLinkCard';
import { StvEmoteEvent } from '../../StvEmoteEvent';
import { SubscriptionNotice } from '../../usernotices/SubscriptionNotice';
import { ViewerMileStoneNoticeComponent } from '../../usernotices/ViewerMilestoneNotice';
import { CharityDonationNotice } from '../../usernotices/CharityDonationNotice';
import { RitualNotice } from '../../usernotices/RitualNotice';
import { styles } from '../RichChatMessage.styles';
import { normaliseUsername } from '../richChatMessageHelpers';
import { EmoteRenderer } from './EmoteRenderer';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

type ChatMessagePartProps = Omit<UseChatMessagePartRendererArgs, 'message'> & {
  index: number;
  message: ParsedPart[];
  mode: 'message' | 'system';
  part: ParsedPart;
};

export function ChatMessagePart({
  compact,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  getMentionColor,
  getPartKey,
  handleEmoteLongPress,
  index,
  message,
  mode,
  moderationNotice,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
  part,
}: ChatMessagePartProps) {
  if (mode === 'system' && part.type === 'text') {
    const isRaidNotice =
      noticeTags?.['msg-id'] === 'raid' || noticeTags?.['msg-id'] === 'unraid';

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

  switch (part.type) {
    case 'text':
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

    case 'stvEmote':
      return (
        <MediaLinkCard
          key={getPartKey(part, index)}
          layout='inline'
          type='stvEmote'
          url={part.content}
        />
      );

    case 'twitchClip':
      return (
        <MediaLinkCard
          key={getPartKey(part, index)}
          type='twitchClip'
          url={part.content}
        />
      );

    case 'link':
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
      const normalisedMentionedUsername = normaliseUsername(mentionedUsername);
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
    case 'stv_emote_removed':
      return (
        <StvEmoteEvent
          key={getPartKey(part, index)}
          disableAnimations={disableEmoteAnimations}
          part={part}
        />
      );

    case 'sub':
    case 'resub':
    case 'submysterygift':
    case 'giftpaidupgrade':
    case 'anongiftpaidupgrade':
    case 'anongift':
    case 'primepaidupgrade': {
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

    case 'viewermilestone':
      return (
        <ViewerMileStoneNoticeComponent
          key={getPartKey(part, index)}
          part={part}
        />
      );

    case 'charitydonation':
      return (
        <CharityDonationNotice key={getPartKey(part, index)} part={part} />
      );

    case 'ritual':
      return <RitualNotice key={getPartKey(part, index)} part={part} />;

    default:
      return null;
  }
}
