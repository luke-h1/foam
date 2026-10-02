import { StyleSheet, type TextStyle } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { Text, type TextProps } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

/**
 * The rendered RNText props with the style flattened, so two renders compare
 * by value and not by array shape.
 */
function getRenderedTextProps(label: string) {
  const {
    children: _children,
    style,
    ...props
  } = screen.getByText(label).props;

  return { ...props, style: StyleSheet.flatten<TextStyle>(style) };
}

function renderBoth(props: Omit<TextProps, 'children'>) {
  render(
    <>
      <ChatText {...props}>chat</ChatText>
      <Text type='callout' family='brand' {...props}>
        design
      </Text>
    </>,
  );

  return {
    chat: getRenderedTextProps('chat'),
    design: getRenderedTextProps('design'),
  };
}

const sizeOnly = StyleSheet.create({
  small: { fontSize: 10 },
});

const cases: [string, Omit<TextProps, 'children'>][] = [
  ['no props', {}],
  ['a theme colour token', { color: 'gray.text' }],
  ['a theme colour group', { color: 'red' }],
  ['tabular numerals', { tabular: true }],
  ['a style array with a body weight', { style: [{ fontWeight: '700' }] }],
  [
    'nested style arrays with falsy entries',
    {
      style: [
        [{ fontSize: 14, lineHeight: 21 }, false],
        null,
        [{ fontWeight: 600 }, undefined],
        { color: '#ff0000' },
      ],
    },
  ],
  [
    'a style that sets its own font family and weight',
    { style: { fontFamily: 'monospace', fontWeight: '600' } },
  ],
  ['italic with a style weight', { italic: true, style: { fontWeight: 800 } }],
  ['italic without a style weight', { italic: true }],
  ['the mono variant', { variant: 'mono', weight: 'semibold' }],
  ['the system family', { family: 'system', weight: 'bold', italic: true }],
  [
    'a caption with an explicit weight',
    { type: 'caption', weight: 'semibold' },
  ],
  ['a title type', { type: 'title2' }],
  ['a centred line', { align: 'center' }],
  ['high contrast', { highContrast: true }],
  ['contrast off', { contrast: false }],
  ['margin props', { mt: 'xs', mx: 4 }],
  [
    'passthrough native props',
    {
      numberOfLines: 2,
      ellipsizeMode: 'tail',
      suppressHighlighting: true,
      testID: 'span',
      maxFontSizeMultiplier: 1.5,
    },
  ],
  ['a registered style number', { style: sizeOnly.small }],
];

describe('ChatText', () => {
  test.each(cases)('renders the same as Text with %s', (_label, props) => {
    const { chat, design } = renderBoth(props);

    expect(chat).toEqual(design);
  });

  test('resolves a style fontWeight to the matching Montserrat family', () => {
    render(<ChatText style={[{ fontWeight: '700' }, null]}>bold</ChatText>);

    const flat = StyleSheet.flatten<TextStyle>(
      screen.getByText('bold').props.style,
    );

    expect({
      fontFamily: flat.fontFamily,
      fontWeight: flat.fontWeight,
    }).toEqual<Pick<TextStyle, 'fontFamily' | 'fontWeight'>>({
      fontFamily: theme.fontFamilyBold,
      fontWeight: undefined,
    });
  });
});
