import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

interface ChatRowTextProps extends Omit<TextProps, 'style'> {
  /**
   * From `getChatRowTextStyle`, which already holds the font, colour and weight
   * that `ChatText` resolves per render.
   */
  style: TextStyle;
}

/**
 * A chat row text span. It renders the same native text as `ChatText` with
 * no per-render style work, so nested spans still merge into one native
 * text view.
 */
export function ChatRowText(props: ChatRowTextProps) {
  return (
    <RNText textBreakStrategy='simple' maxFontSizeMultiplier={2} {...props} />
  );
}
