import { useMemo } from 'react';

import { MediaLinkCard } from '@app/components/chat/components/media-link-card';
import { StvEmoteEvent } from '@app/components/chat/components/stv-emote-event';
import { CharityDonationNotice } from '@app/components/chat/components/usernotices/charity-donation-notice';
import { ModAnniversaryNotice } from '@app/components/chat/components/usernotices/mod-anniversary-notice';
import { RitualNotice } from '@app/components/chat/components/usernotices/ritual-notice';
import { SubscriptionNotice } from '@app/components/chat/components/usernotices/subscription-notice';
import { ViewerMileStoneNoticeComponent } from '@app/components/chat/components/usernotices/viewer-milestone-notice';
import { getChatColorStyle } from '@app/components/chat/util/chat-color-styles';
import { Text } from '@app/components/ui/text/text';
import type { ParsedPart } from '@app/utils/chat/parsed-part';
import { getParsedPartStringContent } from '@app/utils/chat/parsed-part-content';

import { getChatTextStyles } from '../chat-text.styles';
import { styles } from '../rich-chat-message.styles';
import { densityFromCompact, getChatScale } from '../util/chat-scale';
import { CheermoteRenderer } from './cheermote-renderer';
import { EmoteRenderer } from './emote-renderer';
import { MentionSpan } from './mention-span';
import type { ChatMessagePartRendererArgs } from './types/chat-message-part-renderer-args';

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

  const systemContent =
    mode === 'system' && part.type === 'text'
      ? getParsedPartStringContent(part)
      : null;

  if (systemContent !== null && !systemContent.trim()) {
    return null;
  }

  if (systemContent !== null) {
    const content = systemContent;

    const isRaidNotice =
      noticeTags?.['msg-id'] === 'raid' || noticeTags?.['msg-id'] === 'unraid';

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
