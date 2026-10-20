import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { MessageToken } from '@app/utils/chat/message-token';

import { ChatTextStyles } from '../chat-text.styles';
import { ChatInlineImage } from './chat-inline-image';

interface GifTokenProps {
  disableAnimations?: boolean;
  isModerated?: boolean;
  targetSize: number;
  textStyles: ChatTextStyles;
  token: MessageToken<'gif'>;
}

export const GifToken = memo(
  ({
    disableAnimations = false,
    isModerated = false,
    targetSize,
    textStyles,
    token,
  }: GifTokenProps) => {
    if (!token.url) {
      return (
        <ChatText style={[textStyles.body, styles.fallbackText]}>
          {token.content}
        </ChatText>
      );
    }

    const image = (
      <ChatInlineImage
        accessibilityLabel={token.content}
        playAnimation={!disableAnimations}
        sourceUrl={token.url}
        style={getGifImageStyle(targetSize)}
        testID='chat-gif-image'
      />
    );

    if (!isModerated) {
      return image;
    }

    return (
      <View testID='chat-gif' style={styles.moderated}>
        {image}
      </View>
    );
  },
);

GifToken.displayName = 'GifToken';

function getGifImageStyle(size: number) {
  return {
    width: size,
    height: size,
  };
}

const styles = StyleSheet.create({
  moderated: {
    opacity: 0.5,
  },
  fallbackText: {
    opacity: 0.8,
  },
});
