import { shouldAnimateMessageEntrance } from '@app/components/chat/util/chat-messages/should-animate-message-entrance';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import { getChatMessageListKey } from '@app/utils/chat/message-identity/get-chat-message-list-key';
import type {
  NativeChatLine,
  NativeChatRow,
} from '@modules/native-chat-list/src/NativeChatList.types';

import { buildNativeChatPaint } from './build-native-chat-paint';
import { buildNativeNoticeLines } from './build-native-notice-lines';
import {
  buildNativeUserChatLines,
  sharedChatLabelLine,
} from './build-native-user-chat-lines';
import {
  getNativeRowFacts,
  getSenderPaint,
  isHighlightedReplyTarget,
  type NativeRowFacts,
} from './get-native-row-facts';
import { getNativeRowSurface } from './get-native-row-surface';
import type {
  NativeChatRowContext,
  NativeChatRowLiveState,
  NativeRowBuildState,
} from './native-row-context';
import { getAccessibilityLabel } from './native-row-spans';

interface CachedRow {
  context: NativeChatRowContext;
  isHighlightedReplyTarget: boolean;
  mentionLoginRevision: number;
  mentions: NativeRowBuildState['mentions'];
  paint: PaintData | null;
  rewardTitleRevision: number | null;
  row: NativeChatRow;
}

/**
 * Keyed on the committed message object. Messages keep their identity across
 * flushes (ADR-0010), so a row is built once per message unless the context
 * or a live store value it read changes.
 */
const rowCache = new WeakMap<AnyChatMessageType, CachedRow>();

/**
 * `ChatRowItem` decides the entrance once, when the row mounts. A rebuilt
 * native row keeps that first decision.
 */
const entranceDecisions = new WeakMap<AnyChatMessageType, boolean>();

/**
 * A new mention login revision only matters when it changed a colour this
 * row drew. When none changed, the cached row takes the new revision.
 */
function areMentionColorsCurrent(
  cached: CachedRow,
  live: NativeChatRowLiveState,
): boolean {
  if (cached.mentionLoginRevision === live.mentionLoginRevision) {
    return true;
  }

  const isCurrent = cached.mentions.every(
    mention =>
      cached.context.getMentionColor(mention.username) === mention.color,
  );

  if (isCurrent) {
    cached.mentionLoginRevision = live.mentionLoginRevision;
  }

  return isCurrent;
}

function isCachedRowCurrent(
  cached: CachedRow,
  message: AnyChatMessageType,
  context: NativeChatRowContext,
  live: NativeChatRowLiveState,
): boolean {
  return (
    cached.context === context &&
    cached.paint === getSenderPaint(message, live) &&
    cached.isHighlightedReplyTarget ===
      isHighlightedReplyTarget(message, live) &&
    (cached.rewardTitleRevision === null ||
      cached.rewardTitleRevision === live.rewardTitleRevision) &&
    areMentionColorsCurrent(cached, live)
  );
}

function getEntranceDecision(
  message: AnyChatMessageType,
  context: NativeChatRowContext,
): boolean {
  const existing = entranceDecisions.get(message);

  if (existing !== undefined) {
    return existing;
  }

  const decision =
    context.animate && shouldAnimateMessageEntrance(message, Date.now());

  entranceDecisions.set(message, decision);
  return decision;
}

function getStvEventKind(
  facts: NativeRowFacts,
  message: AnyChatMessageType,
): 'added' | 'removed' | null {
  if (facts.bodyVariant !== 'stv_emote_event') {
    return null;
  }

  const token = message.message.find(
    item => item.type === 'stvEmoteAdded' || item.type === 'stvEmoteRemoved',
  );

  if (!token || !('stvEvents' in token) || !token.stvEvents?.data) {
    return null;
  }

  return token.type === 'stvEmoteRemoved' ? 'removed' : 'added';
}

function createNativeChatRow(
  message: AnyChatMessageType,
  state: NativeRowBuildState,
  live: NativeChatRowLiveState,
): NativeChatRow {
  const { context } = state;
  const facts = getNativeRowFacts(message, context, live);
  const isUserRow = facts.isUserChat || facts.bodyVariant === 'announcement';

  const drawnPaint =
    isUserRow &&
    Boolean(facts.paint) &&
    context.paintsEnabled &&
    !facts.isModerated &&
    Boolean(message.userstate.username);

  const lines: NativeChatLine[] = facts.isSharedChatDuplicated
    ? [sharedChatLabelLine(state)]
    : [];

  lines.push(
    ...(isUserRow
      ? buildNativeUserChatLines({ drawnPaint, facts, message, state })
      : buildNativeNoticeLines(state, facts, message)),
  );

  const paint =
    drawnPaint && facts.paint
      ? buildNativeChatPaint(
          facts.paint,
          facts.usernameColor ?? theme.color.text.dark,
        )
      : undefined;

  return {
    key: getChatMessageListKey(message),
    accessibilityLabel: getAccessibilityLabel(lines),
    animateEntrance: getEntranceDecision(message, context),
    canJumpToReply: lines.some(item => item.pressTarget === 'reply'),
    canOpenProfile: isUserRow && Boolean(message.userstate.username),
    lines,
    paint,
    surface: getNativeRowSurface(
      facts,
      context,
      getStvEventKind(facts, message),
    ),
  };
}

/**
 * Builds the row the native list draws. Cached per message, so a flush only
 * pays for the rows it adds or changes.
 */
export function buildNativeChatRow(
  message: AnyChatMessageType,
  context: NativeChatRowContext,
  live: NativeChatRowLiveState,
): NativeChatRow {
  const cached = rowCache.get(message);

  if (cached && isCachedRowCurrent(cached, message, context, live)) {
    return cached.row;
  }

  const state: NativeRowBuildState = {
    context,
    mentions: [],
    usesRewardTitle: false,
  };

  const row = createNativeChatRow(message, state, live);

  rowCache.set(message, {
    context,
    isHighlightedReplyTarget: isHighlightedReplyTarget(message, live),
    mentionLoginRevision: live.mentionLoginRevision,
    mentions: state.mentions,
    paint: getSenderPaint(message, live),
    rewardTitleRevision: state.usesRewardTitle
      ? live.rewardTitleRevision
      : null,
    row,
  });

  return row;
}
