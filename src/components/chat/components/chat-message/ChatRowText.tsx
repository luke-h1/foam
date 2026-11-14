import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

interface ChatRowTextProps extends Omit<TextProps, 'style'> {
  style: TextStyle;
}

export function ChatRowText(props: ChatRowTextProps) {
  return (
    <RNText textBreakStrategy='simple' maxFontSizeMultiplier={2} {...props} />
  );
}
