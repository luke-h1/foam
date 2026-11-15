import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { styles } from '@app/components/chat/components/chat-message/ChatRow.styles';
import { ChatRowText } from '@app/components/chat/components/chat-message/ChatRowText';
import { getChatTextStyles } from '@app/components/chat/components/chat-message/ChatText.styles';
import { getChatRowTextStyleForProp } from '@app/components/chat/components/chat-message/util/chatRowTextStyle';
import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chatScale';
import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';

function getRenderedTextProps(label: string) {
  const {
    children: _children,
    style,
    ...props
  } = screen.getByText(label).props;

  return { ...props, style: StyleSheet.flatten<TextStyle>(style) };
}

const plainUsername: TextStyle = {
  ...chatLineMetrics.comfortable,
  fontWeight: 'bold',
};

const paintTextStyle: TextStyle = {
  fontWeight: '900',
  textTransform: 'uppercase',
};

const shadowStyle: TextStyle = {
  color: '#ff0000',
  left: 1,
  textShadowColor: '#ff0000',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 2,
  top: 1,
};

interface SpanCase {
  before: StyleProp<TextStyle>;
  after: StyleProp<TextStyle>;
}

function getSiteCases(
  usernameTextStyle: StyleProp<TextStyle>,
): [string, SpanCase][] {
  const maskTextStyle = [plainUsername, usernameTextStyle, paintTextStyle];

  return [
    [
      'the username with no paint',
      {
        before: [plainUsername, { color: '#9147FF' }, usernameTextStyle],
        after: [plainUsername, getChatColorStyle('#9147FF'), usernameTextStyle],
      },
    ],
    [
      'the hosted plain colour',
      {
        before: [
          plainUsername,
          usernameTextStyle,
          paintTextStyle,
          { color: '#00ff00' },
        ],
        after: [
          plainUsername,
          usernameTextStyle,
          paintTextStyle,
          getChatColorStyle('#00ff00'),
        ],
      },
    ],
    [
      'the masked fill base',
      {
        before: [maskTextStyle, { color: '#9147FF' }],
        after: [maskTextStyle, getChatColorStyle('#9147FF')],
      },
    ],
    [
      'the mask glyphs',
      {
        before: [maskTextStyle, { color: 'black' }],
        after: [maskTextStyle, { color: 'black' }],
      },
    ],
    [
      'a drop shadow copy',
      {
        before: [{ position: 'absolute' }, maskTextStyle, shadowStyle],
        after: [{ position: 'absolute' }, maskTextStyle, shadowStyle],
      },
    ],
    [
      'the Skia fallback',
      {
        before: { ...plainUsername, color: '#9147FF', opacity: 0.72 },
        after: { ...plainUsername, color: '#9147FF', opacity: 0.72 },
      },
    ],
  ];
}

const scales: [ChatFontScale, ChatDensity][] = [
  ['small', 'compact'],
  ['default', 'comfortable'],
  ['large', 'comfortable'],
];

const cases = scales.flatMap(([fontScale, density]) => {
  const { username } = getChatTextStyles(fontScale, density);

  return [false, true].flatMap(isModerated =>
    getSiteCases([username, isModerated && styles.moderatedUsernameText]).map(
      ([label, spanCase]): [string, string, SpanCase] => [
        label,
        `${fontScale} ${density}${isModerated ? ' moderated' : ''}`,
        spanCase,
      ],
    ),
  );
});

describe('painted username spans', () => {
  test.each(cases)(
    'render the same as ChatText for %s at %s',
    (_label, _scale, { before, after }) => {
      render(
        <>
          <ChatText style={before}>before</ChatText>
          <ChatRowText style={getChatRowTextStyleForProp('muted', after)}>
            after
          </ChatRowText>
        </>,
      );

      expect(getRenderedTextProps('after')).toEqual(
        getRenderedTextProps('before'),
      );
    },
  );
});

describe('getChatRowTextStyleForProp', () => {
  const { username } = getChatTextStyles('default', 'comfortable');

  test('returns the same object for nested arrays of the same parts', () => {
    expect(
      getChatRowTextStyleForProp('muted', [
        plainUsername,
        [username, false],
        paintTextStyle,
      ]),
    ).toBe(
      getChatRowTextStyleForProp('muted', [
        [plainUsername, username],
        null,
        paintTextStyle,
      ]),
    );
  });

  test('resolves more than five parts to the same style without the cache', () => {
    const parts = [
      plainUsername,
      username,
      styles.moderatedUsernameText,
      paintTextStyle,
      getChatColorStyle('#00ff00'),
      { left: 1 },
    ];

    expect(getChatRowTextStyleForProp('muted', parts)).toEqual(
      StyleSheet.flatten([
        getChatRowTextStyleForProp('muted', parts.slice(0, 5)),
        { left: 1 },
      ]),
    );
  });
});
