import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import type { MessageToken } from '@app/utils/chat/message-token';

import type { ChatTextStyles } from '../chat-text.styles';
import { ChatInlineImage } from './chat-inline-image';

interface GifTokenProps {
  disableAnimations?: boolean;
  isModerated?: boolean;
  targetSize: number;
  textStyles: ChatTextStyles;
  token: MessageToken<'gif'>;
}

/**
 * Twitch chat GIF from the PRIVMSG `gifs` tag. Renders `url` as Twitch sent it.
 */
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

    return (
      <View
        testID='chat-gif'
        style={[styles.container, isModerated && styles.moderated]}
      >
        <ChatInlineImage
          playAnimation={!disableAnimations}
          sourceUrl={token.url}
          style={{ width: targetSize, height: targetSize }}
          testID='chat-gif-image'
        />
      </View>
    );
  },
);

GifToken.displayName = 'GifToken';

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  moderated: {
    opacity: 0.5,
  },
  fallbackText: {
    opacity: 0.8,
  },
});
