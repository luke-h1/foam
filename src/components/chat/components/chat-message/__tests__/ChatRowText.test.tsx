import { StyleSheet, type TextStyle } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { TextProps } from '@app/components/ui/text/Text.types';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';

import { styles } from '../ChatRow.styles';
import { ChatRowText } from '../ChatRowText';
import { type ChatTextStyles, getChatTextStyles } from '../ChatText.styles';
import {
  type ChatRowTextPart,
  type ChatRowTextTone,
  getChatRowTextStyle,
} from '../util/chatRowTextStyle';

function getRenderedTextProps(label: string) {
  const {
    children: _children,
    style,
    ...props
  } = screen.getByText(label).props;

  return { ...props, style: StyleSheet.flatten<TextStyle>(style) };
}

interface SpanCase {
  chatTextProps: Omit<TextProps, 'children'>;
  parts: ChatRowTextPart[];
  tone: ChatRowTextTone;
}

const usernameColor = getChatColorStyle('#1e90ff');

function getSiteCases(t: ChatTextStyles): [string, SpanCase][] {
  return [
    [
      'the inline body line',
      {
        chatTextProps: { style: [t.body, undefined] },
        tone: 'muted',
        parts: [t.body, undefined],
      },
    ],
    [
      'the inline body line with emotes',
      {
        chatTextProps: { style: [t.body, t.bodyEmoteLine] },
        tone: 'muted',
        parts: [t.body, t.bodyEmoteLine],
      },
    ],
    [
      'the inline timestamp',
      {
        chatTextProps: { tabular: true, style: [t.timestamp, t.bodyEmoteLine] },
        tone: 'tabular',
        parts: [t.timestamp, t.bodyEmoteLine],
      },
    ],
    [
      'the stacked timestamp',
      {
        chatTextProps: { tabular: true, style: t.timestamp },
        tone: 'tabular',
        parts: [t.timestamp],
      },
    ],
    [
      'the inline username with a colour',
      {
        chatTextProps: {
          suppressHighlighting: true,
          testID: 'chat-username-button',
          style: [t.username, t.bodyEmoteLine, usernameColor],
        },
        tone: 'muted',
        parts: [t.username, t.bodyEmoteLine, usernameColor],
      },
    ],
    [
      'the inline username without a colour',
      {
        chatTextProps: { style: [t.username, undefined, null] },
        tone: 'muted',
        parts: [t.username, undefined, null],
      },
    ],
    [
      'an inline link',
      {
        chatTextProps: { style: [t.link, t.bodyEmoteLine] },
        tone: 'muted',
        parts: [t.link, t.bodyEmoteLine],
      },
    ],
    [
      'an inline text run with a text colour',
      {
        chatTextProps: {
          color: 'gray.text',
          style: [[t.body, t.bodyEmoteLine], usernameColor],
        },
        tone: 'text',
        parts: [t.body, t.bodyEmoteLine, usernameColor],
      },
    ],
    [
      'an inline text run without a text colour',
      {
        chatTextProps: {
          color: 'gray.text',
          style: [[t.body, undefined], null],
        },
        tone: 'text',
        parts: [t.body, undefined, null],
      },
    ],
    [
      'a reply text run to the current user',
      {
        chatTextProps: {
          color: 'gray.text',
          style: [[t.replyContext, styles.replyContextTextReplyToYou], null],
        },
        tone: 'text',
        parts: [t.replyContext, styles.replyContextTextReplyToYou, null],
      },
    ],
    [
      'a highlighted, moderated mention',
      {
        chatTextProps: {
          style: [
            t.mention,
            t.bodyEmoteLine,
            styles.mentionHighlighted,
            usernameColor,
            styles.moderatedMessageText,
          ],
        },
        tone: 'muted',
        parts: [
          t.mention,
          t.bodyEmoteLine,
          styles.mentionHighlighted,
          usernameColor,
          styles.moderatedMessageText,
        ],
      },
    ],
    [
      'a plain mention',
      {
        chatTextProps: {
          style: [t.mention, undefined, false, usernameColor, undefined],
        },
        tone: 'muted',
        parts: [t.mention, undefined, false, usernameColor, undefined],
      },
    ],
    [
      'a reply target mention',
      {
        chatTextProps: { color: 'gray.text', style: [t.body, t.bodyEmoteLine] },
        tone: 'text',
        parts: [t.body, t.bodyEmoteLine],
      },
    ],
    [
      'a wrapped text token on a moderated row',
      {
        chatTextProps: {
          color: 'gray.text',
          style: [t.body, usernameColor, styles.moderatedMessageText],
        },
        tone: 'text',
        parts: [t.body, usernameColor, styles.moderatedMessageText],
      },
    ],
    [
      'a wrapped link',
      {
        chatTextProps: { style: [t.link, false] },
        tone: 'muted',
        parts: [t.link, false],
      },
    ],
    [
      'a system line',
      {
        chatTextProps: { style: [t.body, styles.systemMessageText] },
        tone: 'muted',
        parts: [t.body, styles.systemMessageText],
      },
    ],
    [
      'a raid line',
      {
        chatTextProps: { style: [t.meta, styles.raidNoticeText] },
        tone: 'muted',
        parts: [t.meta, styles.raidNoticeText],
      },
    ],
    [
      'the reply prefix line with emotes',
      {
        chatTextProps: {
          numberOfLines: 1,
          style: [
            [
              t.replyContext,
              styles.replyContextPrefixFlex,
              styles.replyContextTextReplyToYou,
            ],
            t.replyContextEmoteLine,
          ],
        },
        tone: 'muted',
        parts: [
          t.replyContext,
          styles.replyContextPrefixFlex,
          styles.replyContextTextReplyToYou,
          t.replyContextEmoteLine,
        ],
      },
    ],
    [
      'the reply prefix',
      {
        chatTextProps: {
          numberOfLines: 1,
          style: [t.replyContext, styles.replyContextPrefixFlex, false],
        },
        tone: 'muted',
        parts: [t.replyContext, styles.replyContextPrefixFlex, false],
      },
    ],
  ];
}

const scales: [ChatFontScale, ChatDensity][] = [
  ['small', 'comfortable'],
  ['small', 'compact'],
  ['default', 'comfortable'],
  ['default', 'compact'],
  ['large', 'comfortable'],
  ['large', 'compact'],
];

const cases = scales.flatMap(([fontScale, density]) =>
  getSiteCases(getChatTextStyles(fontScale, density)).map(
    ([label, spanCase]): [string, ChatFontScale, ChatDensity, SpanCase] => [
      label,
      fontScale,
      density,
      spanCase,
    ],
  ),
);

describe('ChatRowText', () => {
  test.each(cases)(
    'renders the same as ChatText for %s at %s %s',
    (_label, _fontScale, _density, { chatTextProps, parts, tone }) => {
      const {
        color: _color,
        style: _style,
        tabular: _tabular,
        ...passthroughProps
      } = chatTextProps;

      const [a, b, c, d, e] = parts;

      render(
        <>
          <ChatText {...chatTextProps}>before</ChatText>
          <ChatRowText
            {...passthroughProps}
            style={getChatRowTextStyle(tone, a, b, c, d, e)}
          >
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

describe('getChatRowTextStyle', () => {
  const t = getChatTextStyles('default', 'comfortable');

  test('returns the same object for the same parts', () => {
    expect(getChatRowTextStyle('muted', t.username, t.bodyEmoteLine)).toBe(
      getChatRowTextStyle('muted', t.username, t.bodyEmoteLine),
    );
  });

  test('treats every falsy part as the same part', () => {
    expect(getChatRowTextStyle('text', t.body, undefined, null)).toBe(
      getChatRowTextStyle('text', t.body, false),
    );
  });

  test('keeps tones apart', () => {
    expect(getChatRowTextStyle('muted', t.body)).not.toBe(
      getChatRowTextStyle('text', t.body),
    );
  });

  test('gives a new colour its own style', () => {
    expect(
      getChatRowTextStyle('muted', t.username, getChatColorStyle('#ff0000'))
        .color,
    ).toBe('#ff0000');

    expect(
      getChatRowTextStyle('muted', t.username, getChatColorStyle('#00ff00'))
        .color,
    ).toBe('#00ff00');
  });
});
