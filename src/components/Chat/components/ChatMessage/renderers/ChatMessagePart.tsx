import { useMemo } from 'react';

import { MediaLinkCard } from '@app/components/Chat/components/MediaLinkCard';
import { StvEmoteEvent } from '@app/components/Chat/components/StvEmoteEvent';
import { CharityDonationNotice } from '@app/components/Chat/components/usernotices/CharityDonationNotice';
import { RitualNotice } from '@app/components/Chat/components/usernotices/RitualNotice';
import { SubscriptionNotice } from '@app/components/Chat/components/usernotices/SubscriptionNotice';
import { ViewerMileStoneNoticeComponent } from '@app/components/Chat/components/usernotices/ViewerMilestoneNotice';
import { getChatColorStyle } from '@app/components/Chat/util/chatColorStyles';
import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';

import { styles } from '../RichChatMessage.styles';
import { CheermoteRenderer } from './CheermoteRenderer';
import { EmoteRenderer } from './EmoteRenderer';
import { MentionSpan } from './MentionSpan';
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
  part,
}: ChatMessagePartProps) {
  // Memoize the sub-notice body parse so re-renders reuse the same parts
  // array and SubscriptionNotice's memo holds (a sub train re-rendering its
  // window re-parsed every notice body inline).
  const subMessage =
    'subscriptionEvent' in part ? part.subscriptionEvent?.message : undefined;
  const parsedSubMessage = useMemo(
    () =>
      subMessage && parseTextForEmotes
        ? parseTextForEmotes(subMessage)
        : undefined,
    [subMessage, parseTextForEmotes],
  );

  if (mode === 'system' && part.type === 'text') {
    const content = getParsedPartStringContent(part);
    const isRaidNotice =
      noticeTags?.['msg-id'] === 'raid' || noticeTags?.['msg-id'] === 'unraid';

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
            textColor ? getChatColorStyle(textColor) : null,
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
          isModerated={Boolean(moderationNotice)}
          key={getPartKey(part, index)}
          part={part}
          onEmoteTouchStart={onEmoteTouchStart}
          shouldOverlayPrevious={shouldOverlayPrevious}
          targetSize={emoteTargetSize ?? (compact ? 26 : 30)}
        />
      );
    }

    case 'cheermote':
      return (
        <CheermoteRenderer
          disableAnimations={disableEmoteAnimations}
          isModerated={Boolean(moderationNotice)}
          key={getPartKey(part, index)}
          part={part}
          targetSize={emoteTargetSize ?? (compact ? 26 : 30)}
        />
      );

    case 'mention': {
      // MentionSpan self-subscribes to mentionLoginRevision, so a resolved
      // login/colour updates this span without touching the row.
      return (
        <MentionSpan
          key={getPartKey(part, index)}
          content={getParsedPartStringContent(part)}
          baseTextStyle={[
            styles.messageText,
            compact && styles.messageTextCompact,
            Boolean(moderationNotice) && styles.moderatedMessageText,
          ]}
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
