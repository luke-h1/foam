import { useMemo } from 'react';

import { MediaLinkCard } from '@app/components/Chat/components/MediaLinkCard';
import { StvEmoteEvent } from '@app/components/Chat/components/StvEmoteEvent';
import { CharityDonationNotice } from '@app/components/Chat/components/usernotices/CharityDonationNotice';
import { ModAnniversaryNotice } from '@app/components/Chat/components/usernotices/ModAnniversaryNotice';
import { RitualNotice } from '@app/components/Chat/components/usernotices/RitualNotice';
import { SubscriptionNotice } from '@app/components/Chat/components/usernotices/SubscriptionNotice';
import { ViewerMileStoneNoticeComponent } from '@app/components/Chat/components/usernotices/ViewerMilestoneNotice';
import { getChatColorStyle } from '@app/components/Chat/util/chatColorStyles';
import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';

import { densityFromCompact, getChatScale } from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';
import { CheermoteRenderer } from './CheermoteRenderer';
import { EmoteRenderer } from './EmoteRenderer';
import { MentionSpan } from './MentionSpan';
import type { ChatMessagePartRendererArgs } from './types/ChatMessagePartRendererArgs';

type ChatMessagePartProps = Omit<ChatMessagePartRendererArgs, 'message'> & {
  index: number;
  message: ParsedPart[];
  mode: 'message' | 'system';
  part: ParsedPart;
};

function getNoticeUserMessage(part: ParsedPart): string | undefined {
  switch (part.type) {
    case 'sub':
    case 'resub':
    case 'anongift':
    case 'anongiftpaidupgrade':
    case 'submysterygift':
    case 'giftpaidupgrade':
    case 'primepaidupgrade':
      return part.subscriptionEvent.message;
    case 'charitydonation':
    case 'ritual':
      return part.message;
    case 'viewermilestone':
    case 'modiversary':
      return part.content;
    default:
      return undefined;
  }
}

export function ChatMessagePart({
  compact,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  fontScale,
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
  const noticeMessage = getNoticeUserMessage(part);
  const parsedNoticeMessage = useMemo(
    () =>
      noticeMessage && parseTextForEmotes
        ? parseTextForEmotes(noticeMessage)
        : undefined,
    [noticeMessage, parseTextForEmotes],
  );

  const textStyles = getChatTextStyles(fontScale, compact);
  const scale = getChatScale(fontScale, densityFromCompact(compact));
  const mentionBaseTextStyle = useMemo(
    () => [
      textStyles.body,
      Boolean(moderationNotice) && styles.moderatedMessageText,
    ],
    [textStyles, moderationNotice],
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
        style={
          isRaidNotice
            ? [textStyles.meta, styles.raidNoticeText]
            : [textStyles.body, styles.systemMessageText]
        }
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
            textStyles.body,
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
            textStyles.link,
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
          targetSize={emoteTargetSize ?? scale.emoteSize}
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
          targetSize={emoteTargetSize ?? scale.emoteSize}
        />
      );

    case 'mention': {
      return (
        <MentionSpan
          key={getPartKey(part, index)}
          content={getParsedPartStringContent(part)}
          baseTextStyle={mentionBaseTextStyle}
          compact={compact}
          fontScale={fontScale}
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
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
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
            parsedMessage={parsedNoticeMessage}
          />
        );
      }

      return (
        <SubscriptionNotice
          key={getPartKey(part, index)}
          part={part}
          parsedMessage={parsedNoticeMessage}
        />
      );
    }

    case 'viewermilestone':
      return (
        <ViewerMileStoneNoticeComponent
          key={getPartKey(part, index)}
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedNoticeMessage}
          part={part}
        />
      );

    case 'modiversary':
      return (
        <ModAnniversaryNotice
          key={getPartKey(part, index)}
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedNoticeMessage}
          part={part}
        />
      );

    case 'charitydonation':
      return (
        <CharityDonationNotice
          key={getPartKey(part, index)}
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedNoticeMessage}
          part={part}
        />
      );

    case 'ritual':
      return (
        <RitualNotice
          key={getPartKey(part, index)}
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedNoticeMessage}
          part={part}
        />
      );

    default:
      return null;
  }
}
