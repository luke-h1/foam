import {
  BLUE,
  makeLayer,
  makePaint,
  RED,
  toIndexed,
} from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paint-css.fixture';
import { CHAT_SURFACE_COLORS } from '@app/components/chat/components/chat-message/util/chat-scale';
import { noticeSurfaceTint } from '@app/components/chat/components/util/chat-notice-accents';
import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chat-message.fixture';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import { createTextToken } from '@app/utils/chat/__tests__/__fixtures__/message-token.fixture';
import type {
  NativeChatLine,
  NativeChatPaint,
  NativeChatTextStyle,
} from '@modules/native-chat-list/src/NativeChatList.types';

import { buildNativeChatRow } from '../util/build-native-chat-row';
import { getNativeTextStyle } from '../util/native-text-style-registry';
import {
  createNativeRowContext,
  createNativeRowLiveState,
} from './__fixtures__/build-native-chat-row.fixture';

interface SpanSummary {
  kind: string;
  text: string;
  color?: string;
}

function summariseLines(lines: NativeChatLine[]): SpanSummary[][] {
  return lines.map(line =>
    line.spans.map(span =>
      span.color === undefined
        ? { kind: span.kind, text: span.text }
        : { kind: span.kind, text: span.text, color: span.color },
    ),
  );
}

function createReplyMessage(): AnyChatMessageType {
  return createChatMessageFixture({
    parentDisplayName: 'parent',
    replyDisplayName: 'parent',
    replyBody: 'original words',
    userstate: createUserStateTags({
      username: 'sender',
      login: 'sender',
      color: '#fff',
      'display-name': 'sender',
      'user-id': 'sender-id',
      id: 'msg-1',
      'reply-parent-msg-id': 'parent-msg',
    }),
  });
}

const gradientPaint = makePaint({
  id: 'gradient',
  layers: toIndexed([
    makeLayer({
      angle: 90,
      stops: toIndexed([
        { at: 0, color: RED },
        { at: 1, color: BLUE },
      ]),
    }),
  ]),
});

describe('buildNativeChatRow', () => {
  test('builds a user chat row as one line of spans', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture(),
      createNativeRowContext({ showTimestamps: true }),
      createNativeRowLiveState(),
    );

    expect({
      key: row.key,
      accessibilityLabel: row.accessibilityLabel,
      animateEntrance: row.animateEntrance,
      canJumpToReply: row.canJumpToReply,
      canOpenProfile: row.canOpenProfile,
      lines: summariseLines(row.lines),
      paint: row.paint,
    }).toEqual({
      key: 'msg-1_nonce-1',
      accessibilityLabel: 'sender: hello chat',
      animateEntrance: false,
      canJumpToReply: false,
      canOpenProfile: true,
      lines: [
        [
          { kind: 'timestamp', text: '12:00 ' },
          { kind: 'username', text: 'sender: ', color: '#fff' },
          { kind: 'text', text: 'hello chat' },
        ],
      ],
      paint: undefined,
    });
  });

  test('points each span at a resolved text style', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture(),
      createNativeRowContext(),
      createNativeRowLiveState(),
    );

    const username = row.lines[0]?.spans[0];

    expect(
      username ? getNativeTextStyle(username.style) : null,
    ).toEqual<NativeChatTextStyle>({
      color: '#fafafa',
      fontFamily: 'Montserrat-Bold',
      fontSize: 14,
      letterSpacing: 0,
      lineHeight: 21,
      opacity: 1,
      strikethrough: false,
      underline: false,
    });
  });

  test('colours a mention with the mention colour lookup', () => {
    const message = createChatMessageFixture({
      message: [
        createTextToken('hi '),
        { type: 'mention', content: '@friend' },
      ],
    });

    const row = buildNativeChatRow(
      message,
      createNativeRowContext(),
      createNativeRowLiveState(),
    );

    expect(summariseLines(row.lines)).toEqual<SpanSummary[][]>([
      [
        { kind: 'username', text: 'sender: ', color: '#fff' },
        { kind: 'text', text: 'hi ' },
        { kind: 'mention', text: '@friend', color: '#00ff00' },
      ],
    ]);
  });

  test('adds a reply header line that jumps to the replied message', () => {
    const row = buildNativeChatRow(
      createReplyMessage(),
      createNativeRowContext(),
      createNativeRowLiveState(),
    );

    const header = row.lines[0];

    expect({
      accessibilityLabel: row.accessibilityLabel,
      canJumpToReply: row.canJumpToReply,
      icon: header?.icon?.name,
      numberOfLines: header?.numberOfLines,
      pressTarget: header?.pressTarget,
      lines: summariseLines(row.lines),
    }).toEqual({
      accessibilityLabel:
        'Replying to @parent: original words. sender: hello chat',
      canJumpToReply: true,
      icon: 'text.bubble',
      numberOfLines: 1,
      pressTarget: 'reply',
      lines: [
        [
          { kind: 'text', text: 'Replying to @parent: ' },
          { kind: 'text', text: 'original words' },
        ],
        [
          { kind: 'username', text: 'sender: ', color: '#fff' },
          { kind: 'text', text: 'hello chat' },
        ],
      ],
    });
  });

  test('leaves out the reply header when inline reply context is off', () => {
    const row = buildNativeChatRow(
      createReplyMessage(),
      createNativeRowContext({ showInlineReplyContext: false }),
      createNativeRowLiveState(),
    );

    expect({
      canJumpToReply: row.canJumpToReply,
      lineCount: row.lines.length,
    }).toEqual({ canJumpToReply: false, lineCount: 1 });
  });

  test('tints the surface of a row from a highlighted sender', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture(),
      createNativeRowContext({ highlightedUserSet: new Set(['sender']) }),
      createNativeRowLiveState(),
    );

    expect({
      backgroundColor: row.surface.backgroundColor,
      borderLeftColor: row.surface.borderLeftColor,
    }).toEqual({
      backgroundColor: noticeSurfaceTint(theme.color.brand.twitch, 0.08),
      borderLeftColor: theme.color.brand.twitch,
    });
  });

  test('shades odd rows when alternating rows are on', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture({ seq: 3 }),
      createNativeRowContext({ showAlternatingChatRows: true }),
      createNativeRowLiveState(),
    );

    expect(row.surface.backgroundColor).toBe(
      CHAT_SURFACE_COLORS.alternatingRow,
    );
  });

  test('sends the paint for a painted sender on a stacked line', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture(),
      createNativeRowContext(),
      createNativeRowLiveState({
        paints: { gradient: gradientPaint },
        userPaintIds: { 'sender-id': 'gradient' },
      }),
    );

    expect(row.paint).toEqual<NativeChatPaint>({
      key: `gradient|${row.paint?.key.split('|')[1]}|#fff`,
      baseColor: '#fff',
      dropShadows: [],
      insets: { bottom: 0, left: 0, right: 0, top: 0 },
      layers: [
        {
          kind: 'linear',
          opacity: 1,
          at: null,
          size: null,
          colors: ['rgba(255, 0, 0, 1.000)', 'rgba(0, 0, 255, 1.000)'],
          locations: [0, 1],
          angle: 90,
          ellipse: false,
          tile: 'none',
        },
      ],
      stroke: undefined,
      textShadows: [],
    });
  });

  test('draws no paint when the paint renderer is off', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture(),
      createNativeRowContext({ paintsEnabled: false }),
      createNativeRowLiveState({
        paints: { gradient: gradientPaint },
        userPaintIds: { 'sender-id': 'gradient' },
      }),
    );

    expect(row.paint).toBeUndefined();
  });

  test('strikes through a moderated message', () => {
    const row = buildNativeChatRow(
      createChatMessageFixture({ moderationNotice: 'Deleted by a moderator' }),
      createNativeRowContext(),
      createNativeRowLiveState(),
    );

    expect(row.lines.map(line => line.strikeColor)).toEqual([
      noticeSurfaceTint(CHAT_SURFACE_COLORS.strike, 0.72),
    ]);
  });

  test('returns the cached row for the same message, context and live state', () => {
    const message = createChatMessageFixture();
    const context = createNativeRowContext();
    const live = createNativeRowLiveState();

    expect(buildNativeChatRow(message, context, live)).toBe(
      buildNativeChatRow(message, context, live),
    );
  });

  test('rebuilds the row when the context changes', () => {
    const message = createChatMessageFixture();
    const live = createNativeRowLiveState();
    const first = buildNativeChatRow(message, createNativeRowContext(), live);

    const second = buildNativeChatRow(
      message,
      createNativeRowContext({ showTimestamps: true }),
      live,
    );

    expect(second).not.toBe(first);
  });

  test('rebuilds the row when the sender gets a paint', () => {
    const message = createChatMessageFixture();
    const context = createNativeRowContext();
    const first = buildNativeChatRow(
      message,
      context,
      createNativeRowLiveState(),
    );

    const second = buildNativeChatRow(
      message,
      context,
      createNativeRowLiveState({
        paints: { gradient: gradientPaint },
        userPaintIds: { 'sender-id': 'gradient' },
      }),
    );

    expect(second).not.toBe(first);
  });

  test('keeps the cached row when a mention revision changes no colour it drew', () => {
    const message = createChatMessageFixture({
      message: [{ type: 'mention', content: '@friend' }],
    });

    const context = createNativeRowContext();
    const first = buildNativeChatRow(
      message,
      context,
      createNativeRowLiveState(),
    );

    const second = buildNativeChatRow(
      message,
      context,
      createNativeRowLiveState({ mentionLoginRevision: 1 }),
    );

    expect(second).toBe(first);
  });

  test('rebuilds the row when a mention colour it drew changes', () => {
    const message = createChatMessageFixture({
      message: [{ type: 'mention', content: '@friend' }],
    });

    let mentionColor = '#00ff00';
    const context = createNativeRowContext({
      getMentionColor: () => mentionColor,
    });

    const first = buildNativeChatRow(
      message,
      context,
      createNativeRowLiveState(),
    );
    mentionColor = '#ff0000';

    const second = buildNativeChatRow(
      message,
      context,
      createNativeRowLiveState({ mentionLoginRevision: 1 }),
    );

    expect(summariseLines(second.lines)).toEqual<SpanSummary[][]>([
      [
        { kind: 'username', text: 'sender: ', color: '#fff' },
        { kind: 'mention', text: '@friend', color: '#ff0000' },
      ],
    ]);
    expect(second).not.toBe(first);
  });
});
