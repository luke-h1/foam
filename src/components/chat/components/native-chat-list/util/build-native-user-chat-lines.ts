import { styles } from '@app/components/chat/components/chat-message/chat-row.styles';
import { getChatTextStyles } from '@app/components/chat/components/chat-message/chat-text.styles';
import { buildPaintUsernameTextStyle } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-text-style/build-paint-username-text-style';
import { CHAT_SURFACE_COLORS } from '@app/components/chat/components/chat-message/util/chat-scale';
import {
  CHAT_NOTICE_ACCENTS,
  noticeSurfaceTint,
} from '@app/components/chat/components/util/chat-notice-accents';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { resolveChannelPointRewardTitle } from '@app/utils/chat/channel-point-reward-title-store';
import { channelPointsRewardTitleFieldsFromUserstate } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-fields-from-userstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-from-tags';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-from-userstate';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flows-inline';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/get-message-structure';
import type { MessageToken } from '@app/utils/chat/message-token';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalize-seven-tv-badge';
import type {
  NativeChatLine,
  NativeChatSpan,
} from '@modules/native-chat-list/src/NativeChatList.types';

import type { NativeRowFacts } from './get-native-row-facts';
import type { NativeRowBuildState } from './native-row-context';
import {
  getRowScale,
  getRowTextStyles,
  line,
  messageTokenSpans,
  metaLabelSpan,
  metaLine,
  style,
  textSpan,
} from './native-row-spans';

interface UserChatLineInput {
  facts: NativeRowFacts;
  message: AnyChatMessageType;

  /**
   * True when the native list draws the sender's paint. False when the paint
   * renderer is off or the username is struck.
   */
  drawnPaint: boolean;
  state: NativeRowBuildState;
}

function badgeSpans(
  state: NativeRowBuildState,
  message: AnyChatMessageType,
  isModerated: boolean,
): NativeChatSpan[] {
  const scale = getRowScale(state);
  const spans: NativeChatSpan[] = [];

  message.badges.forEach((badge, index) => {
    const normalized = normalizeSevenTvBadge(badge);

    if (!normalized.url?.trim()) {
      return;
    }

    spans.push({
      kind: 'badge',
      text: normalized.title ?? '',
      style: style([]),
      url: normalized.url,
      width: scale.badgeSize,
      height: scale.badgeSize,
      marginRight: scale.badgeGap,
      opacity: isModerated ? 0.72 : undefined,
      tint: normalized.color || undefined,
      index,
    });
  });

  return spans;
}

function applyTextTransform(
  text: string,
  transform: 'lowercase' | 'uppercase' | undefined,
): string {
  if (transform === 'uppercase') {
    return text.toUpperCase();
  }

  return transform === 'lowercase' ? text.toLowerCase() : text;
}

/**
 * `StackedMessageLine`: used when the sender has a paint or the message was
 * moderated. The username always ends in `: ` here.
 */
function stackedMessageLine({
  drawnPaint,
  facts,
  message,
  state,
}: UserChatLineInput): NativeChatLine {
  const textStyles = getRowTextStyles(state);
  const scale = getRowScale(state);
  const { userstate } = message;
  const username = userstate.username;
  const isModerated = facts.isModerated;
  const spans: NativeChatSpan[] = [];

  if (state.context.showTimestamps && message.timestamp) {
    spans.push({
      kind: 'timestamp',
      text: message.timestamp,
      style: style([textStyles.timestamp]),
      marginRight: scale.gap,
      index: -1,
    });
  }

  spans.push(...badgeSpans(state, message, isModerated));

  if (username) {
    const paintTextStyle =
      drawnPaint && facts.paint
        ? buildPaintUsernameTextStyle(facts.paint)
        : undefined;

    spans.push({
      kind: 'username',
      text: applyTextTransform(
        `${username}: `,
        drawnPaint ? facts.paint?.textStyle?.transform : undefined,
      ),
      style: style([
        textStyles.username,
        isModerated && styles.moderatedUsernameText,
        paintTextStyle,
      ]),
      color: isModerated ? undefined : facts.usernameColor,
      index: -1,
    });
  }

  const bodyFlowsInline = flowsInline(message.message, {
    hasPaint: false,
    isModerated,
  });

  const bodyEmoteLineStyle =
    bodyFlowsInline && getMessageStructure(message.message).containsEmotes
      ? textStyles.bodyEmoteLine
      : undefined;

  spans.push(
    ...messageTokenSpans(state, message.message, {
      emoteSize: scale.emoteSize,
      emoteLineStyle: bodyEmoteLineStyle,
      mode: 'message',
      replyPlainMentionTarget: getReplyPlainMentionTarget(facts, message),
      textColor: message.isAction ? facts.usernameColor : undefined,
      textStyle: style([textStyles.body, bodyEmoteLineStyle], 'gray.text'),
    }),
  );

  return line(spans, {
    strikeColor: isModerated
      ? noticeSurfaceTint(CHAT_SURFACE_COLORS.strike, 0.72)
      : undefined,
  });
}

function getReplyPlainMentionTarget(
  facts: NativeRowFacts,
  message: AnyChatMessageType,
): string | undefined {
  return facts.shouldRenderInlineReply
    ? normaliseChatUsername(message.parentDisplayName)
    : undefined;
}

/**
 * `InlineMessageLine`: timestamp, badges, username and body in one wrapped
 * paragraph.
 */
function inlineMessageLine({
  facts,
  message,
  state,
}: UserChatLineInput): NativeChatLine {
  const textStyles = getRowTextStyles(state);
  const scale = getRowScale(state);
  const { userstate } = message;
  const username = userstate.username;

  const emoteLineStyle = getMessageStructure(message.message).containsEmotes
    ? textStyles.bodyEmoteLine
    : undefined;

  const spans: NativeChatSpan[] = [];

  if (state.context.showTimestamps && message.timestamp) {
    spans.push({
      kind: 'timestamp',
      text: `${message.timestamp} `,
      style: style([textStyles.timestamp, emoteLineStyle]),
      index: -1,
    });
  }

  spans.push(...badgeSpans(state, message, false));

  if (username) {
    spans.push({
      kind: 'username',
      text: message.isAction ? `${username} ` : `${username}: `,
      style: style([textStyles.username, emoteLineStyle]),
      color: facts.usernameColor,
      index: -1,
    });
  }

  spans.push(
    ...messageTokenSpans(state, message.message, {
      emoteSize: scale.emoteSize,
      emoteLineStyle,
      mode: 'message',
      replyPlainMentionTarget: getReplyPlainMentionTarget(facts, message),
      textColor: message.isAction ? facts.usernameColor : undefined,
      textStyle: style([textStyles.body, emoteLineStyle], 'gray.text'),
    }),
  );

  return line(spans);
}

/**
 * `ReplyingToHeader`: one truncated line quoting the parent message.
 */
function replyHeaderLine(
  state: NativeRowBuildState,
  facts: NativeRowFacts,
  message: AnyChatMessageType,
): NativeChatLine {
  const textStyles = getRowTextStyles(state);
  const scale = getRowScale(state);
  const toYou = facts.isReplyingToCurrentUser;
  const trimmedBody = message.replyBody?.trim();

  const quote: MessageToken[] = trimmedBody
    ? state.context.parseTextForEmotes(trimmedBody)
    : [];

  const prefix = toYou
    ? 'Replying to you'
    : `Replying to @${message.parentDisplayName}`;

  const replyTextStyle = style([
    textStyles.replyContext,
    toYou && styles.replyContextTextReplyToYou,
  ]);

  const spans: NativeChatSpan[] = [
    textSpan(quote.length > 0 ? `${prefix}: ` : prefix, replyTextStyle),
    ...messageTokenSpans(state, quote, {
      emoteSize: scale.replyEmoteSize,
      mode: 'message',
      replyPlainMentionTarget: normaliseChatUsername(message.parentDisplayName),
      textStyle: replyTextStyle,
    }),
  ];

  return line(spans, {
    background: toYou
      ? {
          color: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.replyToYou, 0.14),
          paddingHorizontal: 6,
          paddingVertical: 3,
          radius: CHAT_SURFACE_COLORS.radius,
        }
      : undefined,
    icon: {
      color: toYou ? CHAT_NOTICE_ACCENTS.replyToYou : CHAT_SURFACE_COLORS.muted,
      marginRight: 4,
      name: 'text.bubble',
      size: scale.metaIconSize,
    },
    marginBottom: 4,
    minLineHeight: getMessageStructure(quote).containsEmotes
      ? scale.replyEmoteLineHeight
      : undefined,
    numberOfLines: 1,
    pressTarget: facts.replyParentMessageId ? 'reply' : undefined,
  });
}

/**
 * `ChatRowMetaHeader`: a reply header wins over the first-message and
 * returning-chatter labels. It passes no font scale to the meta row, so
 * those labels use the default scale.
 */
function metaHeaderLine(
  state: NativeRowBuildState,
  facts: NativeRowFacts,
  message: AnyChatMessageType,
): NativeChatLine | null {
  if (facts.shouldRenderInlineReply && message.parentDisplayName) {
    return replyHeaderLine(state, facts, message);
  }

  const defaultScaleStyles = getChatTextStyles(
    undefined,
    state.context.compact,
  );

  if (facts.isFirstMessage) {
    return metaLine({
      icon: 'sparkles',
      iconColor: CHAT_NOTICE_ACCENTS.firstMessage,
      spans: [
        metaLabelSpan(
          defaultScaleStyles,
          'First message',
          CHAT_NOTICE_ACCENTS.firstMessage,
          styles.firstMessageMetaText,
        ),
      ],
    });
  }

  if (facts.isReturningChatter) {
    return metaLine({
      icon: 'arrow.uturn.left',
      iconColor: CHAT_NOTICE_ACCENTS.returningChatter,
      spans: [
        metaLabelSpan(
          defaultScaleStyles,
          'Returning chatter',
          CHAT_NOTICE_ACCENTS.returningChatter,
          styles.returningChatterMetaText,
        ),
      ],
    });
  }

  return null;
}

/**
 * `ChannelPointsRewardMetaRow`. The reward title can arrive after the
 * message, so the row records that it read it.
 */
function channelPointsLine(
  state: NativeRowBuildState,
  facts: NativeRowFacts,
  message: AnyChatMessageType,
): NativeChatLine {
  state.usesRewardTitle = true;

  const textStyles = getRowTextStyles(state);
  const { userstate } = message;

  const title =
    channelPointsRewardTitleFromUserstate(userstate) ??
    (facts.noticeTags
      ? channelPointsRewardTitleFromTags(facts.noticeTags)
      : undefined) ??
    resolveChannelPointRewardTitle({
      tags: channelPointsRewardTitleFieldsFromUserstate(userstate),
      broadcasterId: facts.roomId,
    }) ??
    'Channel Points reward';

  if (facts.isHighlightedMessage) {
    return metaLine({
      icon: 'sparkles',
      iconColor: CHAT_NOTICE_ACCENTS.highlight,
      spans: [
        metaLabelSpan(
          textStyles,
          title,
          CHAT_NOTICE_ACCENTS.highlight,
          styles.highlightMyMessageMetaText,
        ),
      ],
    });
  }

  const struck = facts.isModerated && styles.moderatedMessageText;

  return metaLine({
    icon: 'gift.fill',
    iconColor: CHAT_NOTICE_ACCENTS.channelPoints,
    spans: [
      textSpan(
        userstate.username ?? '',
        style([textStyles.meta, styles.channelPointsMetaName, struck]),
      ),
      textSpan(
        ' redeemed ',
        style([textStyles.meta, styles.channelPointsMetaMuted, struck]),
      ),
      textSpan(
        title,
        style([textStyles.meta, styles.channelPointsMetaReward, struck]),
      ),
    ],
  });
}

export function sharedChatLabelLine(
  state: NativeRowBuildState,
): NativeChatLine {
  const textStyles = getRowTextStyles(state);

  return metaLine({
    icon: 'bubble.left.and.bubble.right.fill',
    iconSize: getRowScale(state).metaIconSize,
    spans: [
      textSpan(
        'Via shared chat',
        style([textStyles.meta, styles.sharedChatLabelText]),
      ),
    ],
  });
}

/**
 * `UserChatBody`, with the `AnnouncementChatBody` meta row above it for an
 * announcement.
 */
export function buildNativeUserChatLines(
  input: UserChatLineInput,
): NativeChatLine[] {
  const { facts, message, state } = input;
  const lines: NativeChatLine[] = [];
  const isAnnouncement = facts.bodyVariant === 'announcement';

  if (isAnnouncement) {
    lines.push(
      metaLine({
        icon: 'megaphone.fill',
        iconColor:
          facts.announcementAccentColor ?? styles.announcementMetaText.color,

        // `announcementColumn` adds a 4pt gap under the meta row's margin.
        marginBottom: 8,
        spans: [
          metaLabelSpan(
            getRowTextStyles(state),
            'Announcement',
            facts.announcementAccentColor,
            styles.announcementMetaText,
          ),
        ],
      }),
    );
  }

  const header = isAnnouncement ? null : metaHeaderLine(state, facts, message);

  if (header) {
    lines.push(header);
  }

  if (!isAnnouncement && facts.showChannelPointsRewardChrome) {
    lines.push(channelPointsLine(state, facts, message));
  }

  const rowFlowsInline = flowsInline(message.message, {
    hasPaint: Boolean(facts.paint),
    isModerated: facts.isModerated,
  });

  lines.push(
    rowFlowsInline ? inlineMessageLine(input) : stackedMessageLine(input),
  );

  return lines;
}
