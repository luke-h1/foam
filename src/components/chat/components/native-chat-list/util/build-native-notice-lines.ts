import { StyleSheet } from 'react-native';

import { styles } from '@app/components/chat/components/chat-message/chat-row.styles';
import {
  subscriptionNoticeStyles,
  subscriptionSegmentStyles,
} from '@app/components/chat/components/user-notices/subscription-notice.styles';
import {
  getMilestoneMetaLabel,
  getRitualDescription,
  getRitualIcon,
  getRitualMetaLabel,
} from '@app/components/chat/components/user-notices/util/notice-labels';
import { splitNoticeSubject } from '@app/components/chat/components/user-notices/util/notice-sentence';
import {
  getSubscriptionDescriptionInput,
  getSubscriptionNoticeSegments,
  type SubscriptionNoticeToken,
} from '@app/components/chat/components/user-notices/util/subscription-notice-segments';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/components/util/chat-notice-accents';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { resolveThemeColor } from '@app/styles/themes';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';
import type { MessageToken } from '@app/utils/chat/message-token';
import { getDisplayEmoteUrl } from '@app/utils/emote/get-display-emote-url';
import type {
  NativeChatLine,
  NativeChatSpan,
} from '@modules/native-chat-list/src/NativeChatList.types';

import type { NativeRowFacts } from './get-native-row-facts';
import type { NativeRowBuildState } from './native-row-context';
import {
  emoteSpan,
  getRowScale,
  getRowTextStyles,
  line,
  messageTokenSpans,
  metaLabelSpan,
  metaLine,
  style,
  textSpan,
} from './native-row-spans';

const SYSTEM_MODE_VARIANTS: ReadonlySet<ChatBodyVariant> = new Set([
  'app_system_sender',
  'raid',
  'twitch_system_notice',
]);

/**
 * Tokens that sit side by side in `WrappedTokens`. Every other token draws a
 * full-width column, so it starts and ends its own lines.
 */
const INLINE_TOKEN_TYPES: ReadonlySet<MessageToken['type']> = new Set([
  'cheermote',
  'emote',
  'link',
  'mention',
  'stvEmoteLink',
  'text',
  'twitchClip',
]);

const STV_CREATOR_STYLE = StyleSheet.create({
  creator: { color: resolveThemeColor('gray.accentHover') },
}).creator;

function parseNoticeMessage(
  state: NativeRowBuildState,
  message: string | undefined,
): MessageToken[] {
  return message ? state.context.parseTextForEmotes(message) : [];
}

/**
 * `NoticeUserMessage`: the chatter's own words under a notice.
 */
function noticeUserMessageLine(
  state: NativeRowBuildState,
  message: string | undefined,
): NativeChatLine | null {
  const trimmed = message?.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = parseNoticeMessage(state, message);
  const textStyle = style([getRowTextStyles(state).body], 'gray.text');

  const tokens: MessageToken[] =
    parsed.length > 0 ? parsed : [{ type: 'text', content: trimmed }];

  const spans = tokens.flatMap((token): NativeChatSpan[] => {
    if (token.type === 'emote') {
      return [
        emoteSpan(state, token, {
          disableAnimations: state.context.disableEmoteAnimations,
          index: -1,
          overlapPrevious: false,
          targetSize: getRowScale(state).emoteSize,
        }),
      ];
    }

    return INLINE_TOKEN_TYPES.has(token.type) && 'content' in token
      ? [textSpan(token.content, textStyle)]
      : [];
  });

  return line(spans);
}

/**
 * Twitch's sentence with the chatter's name picked out of it.
 */
function subjectLine(
  state: NativeRowBuildState,
  systemMsg: string,
  displayName: string,
): NativeChatLine | null {
  if (!systemMsg) {
    return null;
  }

  const textStyles = getRowTextStyles(state);
  const { lead, rest } = splitNoticeSubject(systemMsg, displayName);
  const spans: NativeChatSpan[] = [];

  if (lead) {
    spans.push(
      textSpan(lead, style([textStyles.meta, styles.channelPointsMetaName])),
    );
  }

  if (rest) {
    spans.push(
      textSpan(
        lead ? ` ${rest}` : rest,
        style([textStyles.meta, styles.channelPointsMetaMuted]),
      ),
    );
  }

  return line(spans);
}

function compact(lines: (NativeChatLine | null)[]): NativeChatLine[] {
  return lines.filter((item): item is NativeChatLine => item !== null);
}

function subscriptionLines(
  state: NativeRowBuildState,
  token: SubscriptionNoticeToken,
): NativeChatLine[] {
  const { subscriptionEvent } = token;
  const { displayName, message } = subscriptionEvent;
  const parsed = parseNoticeMessage(state, message);

  const segments = getSubscriptionNoticeSegments(
    getSubscriptionDescriptionInput(subscriptionEvent),
  );

  const messageStyle = style([subscriptionNoticeStyles.messageText]);

  const messageSpans =
    parsed.length > 0
      ? parsed.flatMap((part): NativeChatSpan[] => {
          if (part.type === 'text') {
            return [textSpan(part.content, messageStyle)];
          }

          return part.type === 'emote' && part.url
            ? [
                {
                  kind: 'emote',
                  text: part.content || part.name || '',
                  style: style([]),
                  url: part.url,
                  width: subscriptionNoticeStyles.emote.width,
                  height: subscriptionNoticeStyles.emote.height,
                  marginRight:
                    subscriptionNoticeStyles.emote.marginHorizontal * 2,
                  index: -1,
                },
              ]
            : [];
        })
      : [];

  if (messageSpans.length === 0 && message?.trim()) {
    messageSpans.push(textSpan(message.trim(), messageStyle));
  }

  const hasMessage = messageSpans.length > 0;

  return compact([
    metaLine({
      icon: 'star.fill',
      iconColor: CHAT_NOTICE_ACCENTS.subscription,

      // `subscriptionNoticeColumn` adds a 4pt gap when the message follows.
      marginBottom: hasMessage ? 8 : 4,
      spans: [
        {
          ...textSpan(displayName, style([subscriptionNoticeStyles.username])),
          marginRight: 4,
        },
        ...segments.map(segment =>
          textSpan(
            segment.text,
            style([subscriptionSegmentStyles[segment.tone]]),
          ),
        ),
      ],
    }),
    hasMessage ? line(messageSpans) : null,
  ]);
}

function viewerMilestoneLines(
  state: NativeRowBuildState,
  token: MessageToken<'viewermilestone'>,
): NativeChatLine[] {
  const textStyles = getRowTextStyles(state);
  const displayName = token.displayName?.trim() || '';
  const systemMsg = token.systemMsg?.trim() || '';
  const content = token.content?.trim() || '';

  if (!systemMsg && !content) {
    return [];
  }

  const reward = Number.parseInt(token.reward, 10);

  const labelSpans: NativeChatSpan[] = [
    textSpan(
      getMilestoneMetaLabel(token.category),
      style([
        textStyles.meta,
        textStyles.metaStrong,
        styles.viewerMilestoneMetaText,
      ]),
    ),
  ];

  if (Number.isFinite(reward) && reward > 0) {
    labelSpans.push(
      textSpan(
        `+${reward} ${reward === 1 ? 'point' : 'points'}`,
        style([textStyles.meta, styles.channelPointsMetaReward]),
      ),
    );
  }

  return compact([
    metaLine({
      icon: 'flame.fill',
      iconColor: CHAT_NOTICE_ACCENTS.viewerMilestone,
      spans: labelSpans,
    }),
    subjectLine(state, systemMsg, displayName),
    noticeUserMessageLine(state, content),
  ]);
}

function modAnniversaryLines(
  state: NativeRowBuildState,
  token: MessageToken<'modiversary'>,
): NativeChatLine[] {
  const displayName = token.displayName?.trim() || '';
  const systemMsg = token.systemMsg?.trim() || '';
  const content = token.content?.trim() || '';

  if (!systemMsg && !content) {
    return [];
  }

  return compact([
    metaLine({
      icon: 'shield.fill',
      iconColor: CHAT_NOTICE_ACCENTS.modAnniversary,
      spans: [
        metaLabelSpan(
          getRowTextStyles(state),
          'Mod anniversary',
          CHAT_NOTICE_ACCENTS.modAnniversary,
          styles.modAnniversaryMetaText,
        ),
      ],
    }),
    subjectLine(state, systemMsg, displayName),
    noticeUserMessageLine(state, content),
  ]);
}

function charityLines(
  state: NativeRowBuildState,
  token: MessageToken<'charitydonation'>,
): NativeChatLine[] {
  const textStyles = getRowTextStyles(state);
  const displayName = token.displayName?.trim();
  const message = token.message?.trim() ?? '';
  const mutedStyle = style([textStyles.meta, styles.channelPointsMetaMuted]);
  const spans: NativeChatSpan[] = [];

  if (displayName) {
    spans.push(
      textSpan(
        displayName,
        style([textStyles.meta, styles.channelPointsMetaName]),
      ),
      textSpan(' · ', mutedStyle),
    );
  }

  spans.push(
    textSpan(`donated ${token.amount} to ${token.charityName}`, mutedStyle),
    textSpan(
      token.systemMsg && !message ? `. ${token.systemMsg}` : '.',
      mutedStyle,
    ),
  );

  return compact([
    metaLine({
      icon: 'heart.fill',
      iconColor: CHAT_NOTICE_ACCENTS.charity,
      spans: [
        metaLabelSpan(
          textStyles,
          'Charity donation',
          CHAT_NOTICE_ACCENTS.charity,
        ),
      ],
    }),
    line(spans),
    noticeUserMessageLine(state, message),
  ]);
}

function ritualLines(
  state: NativeRowBuildState,
  token: MessageToken<'ritual'>,
): NativeChatLine[] {
  const textStyles = getRowTextStyles(state);
  const displayName = token.displayName?.trim();
  const message = token.message?.trim() ?? '';

  const description =
    token.systemMsg ||
    (displayName ? getRitualDescription(token.ritualName, displayName) : '');

  if (!description && !message) {
    return [];
  }

  return compact([
    metaLine({
      icon: getRitualIcon(token.ritualName),
      iconColor: CHAT_NOTICE_ACCENTS.ritual,
      spans: [
        metaLabelSpan(
          textStyles,
          getRitualMetaLabel(token.ritualName),
          CHAT_NOTICE_ACCENTS.ritual,
          styles.ritualNoticeMetaText,
        ),
      ],
    }),
    description
      ? line([
          textSpan(
            description,
            style([textStyles.body, styles.channelPointsMetaMuted]),
          ),
        ])
      : null,
    noticeUserMessageLine(state, message),
  ]);
}

/**
 * `StvEmoteEvent`. The React card puts the creator on a second line beside
 * the image; here it follows the name on the same line.
 */
function stvEmoteEventLines(
  state: NativeRowBuildState,
  token: MessageToken<'stvEmoteAdded' | 'stvEmoteRemoved'>,
): NativeChatLine[] {
  const content = token.stvEvents?.data;

  if (!content) {
    return [];
  }

  const textStyles = getRowTextStyles(state);
  const removed = token.type === 'stvEmoteRemoved';

  const accentColor = removed
    ? CHAT_NOTICE_ACCENTS.stvRemoved
    : CHAT_NOTICE_ACCENTS.stvAdded;

  const metaSpans: NativeChatSpan[] = [
    textSpan(
      `${removed ? 'Removed' : 'Added'} emote`,
      style([textStyles.meta, textStyles.metaStrong]),
      accentColor,
    ),
  ];

  const actorName = content.actor?.display_name;

  if (actorName) {
    metaSpans.push(textSpan(` · ${actorName}`, style([textStyles.meta])));
  }

  const displayUrl = getDisplayEmoteUrl({
    url: content.url,
    static_url: content.static_url,
    disableAnimations: state.context.disableEmoteAnimations,
  });

  const contentSpans: NativeChatSpan[] = [];

  if (displayUrl) {
    contentSpans.push({
      kind: 'emote',
      text: content.name,
      style: style([]),
      url: displayUrl,
      width: 56,
      height: 28,
      marginRight: 8,
      index: -1,
    });
  }

  contentSpans.push(textSpan(content.name, style([textStyles.meta])));

  if (content.creator) {
    contentSpans.push(
      textSpan(
        ` · By ${content.creator}`,
        style([textStyles.meta, STV_CREATOR_STYLE]),
      ),
    );
  }

  return [
    metaLine({ icon: 'sparkles', iconColor: accentColor, spans: metaSpans }),
    line(contentSpans),
  ];
}

function blockTokenLines(
  state: NativeRowBuildState,
  token: MessageToken,
): NativeChatLine[] {
  switch (token.type) {
    case 'sub':
    case 'resub':
    case 'submysterygift':
    case 'giftpaidupgrade':
    case 'anongiftpaidupgrade':
    case 'anongift':
    case 'primepaidupgrade':
      return subscriptionLines(state, token);

    case 'viewermilestone':
      return viewerMilestoneLines(state, token);

    case 'modiversary':
      return modAnniversaryLines(state, token);

    case 'charitydonation':
      return charityLines(state, token);

    case 'ritual':
      return ritualLines(state, token);

    case 'stvEmoteAdded':
    case 'stvEmoteRemoved':
      return stvEmoteEventLines(state, token);

    default:
      return [];
  }
}

interface NoticeBodyInput {
  facts: NativeRowFacts;
  leadingSpans: NativeChatSpan[];
  message: AnyChatMessageType;
  state: NativeRowBuildState;
}

/**
 * `WrappedTokens` inside the notice row. Inline tokens share a line with the
 * timestamp; a notice token's column takes the full width, so it starts on a
 * new line.
 */
function noticeBodyLines({
  facts,
  leadingSpans,
  message,
  state,
}: NoticeBodyInput): NativeChatLine[] {
  const tokens = message.message;
  const lines: NativeChatLine[] = [];
  let pending: NativeChatSpan[] = [...leadingSpans];
  let runStart = 0;

  const textStyles = getRowTextStyles(state);
  const scale = getRowScale(state);

  const flushRun = (end: number) => {
    if (end > runStart) {
      pending.push(
        ...messageTokenSpans(state, tokens.slice(runStart, end), {
          emoteSize: scale.emoteSize,
          indexOffset: runStart,
          mode: SYSTEM_MODE_VARIANTS.has(facts.bodyVariant)
            ? 'system'
            : 'message',
          noticeMsgId: facts.noticeMsgId,
          textStyle: style([textStyles.body], 'gray.text'),
        }),
      );
    }

    if (pending.length > 0) {
      lines.push(line(pending));
    }

    pending = [];
  };

  tokens.forEach((token, index) => {
    if (INLINE_TOKEN_TYPES.has(token.type)) {
      return;
    }

    flushRun(index);
    lines.push(...blockTokenLines(state, token));
    runStart = index + 1;
  });

  flushRun(tokens.length);
  return lines;
}

/**
 * `ChatNoticeBody`: every row that is not user chat or an announcement.
 */
export function buildNativeNoticeLines(
  state: NativeRowBuildState,
  facts: NativeRowFacts,
  message: AnyChatMessageType,
): NativeChatLine[] {
  const textStyles = getRowTextStyles(state);

  const showTimestamp =
    facts.bodyVariant !== 'subscription' &&
    state.context.showTimestamps &&
    Boolean(message.timestamp);

  const leadingSpans: NativeChatSpan[] = showTimestamp
    ? [
        {
          kind: 'timestamp',
          text: message.timestamp ?? '',
          style: style([textStyles.timestamp]),
          marginRight: getRowScale(state).gap,
          index: -1,
        },
      ]
    : [];

  const body = noticeBodyLines({ facts, leadingSpans, message, state });

  if (facts.bodyVariant !== 'raid') {
    return body;
  }

  const isUnraid = facts.noticeMsgId === 'unraid';

  return [
    metaLine({
      icon: isUnraid ? 'xmark.circle.fill' : 'person.3.fill',
      iconColor: CHAT_NOTICE_ACCENTS.raid,
      spans: [
        metaLabelSpan(
          textStyles,
          isUnraid ? 'Raid cancelled' : 'Raid',
          CHAT_NOTICE_ACCENTS.raid,
          styles.raidNoticeMetaText,
        ),
      ],
    }),
    ...body,
  ];
}
