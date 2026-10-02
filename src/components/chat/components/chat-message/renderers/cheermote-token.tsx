import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import type { MessageToken } from '@app/utils/chat/message-token';

import type { ChatTextStyles } from '../chat-text.styles';
import { ChatInlineImage } from './chat-inline-image';

interface CheermoteTokenProps {
  disableAnimations?: boolean;
  isModerated?: boolean;
  textStyles: ChatTextStyles;
  token: MessageToken<'cheermote'>;
  targetSize?: number;
}

export const CheermoteToken = memo(
  ({
    token,
    disableAnimations = false,
    isModerated = false,
    textStyles,
    targetSize = 30,
  }: CheermoteTokenProps) => {
    const sourceUrl = disableAnimations
      ? token.cheermote.static_url || token.cheermote.url
      : token.cheermote.url || token.cheermote.static_url;

    if (!sourceUrl) {
      return (
        <ChatText style={[textStyles.body, styles.fallbackText]}>
          {token.content}
        </ChatText>
      );
    }

    return (
      <View
        testID='cheermote-container'
        style={[styles.container, isModerated && styles.moderated]}
      >
        <ChatInlineImage
          sourceUrl={sourceUrl}
          style={{ width: targetSize, height: targetSize }}
        />
        <ChatText
          weight='bold'
          style={[textStyles.body, { color: token.cheermote.color }]}
        >
          {token.cheermote.bits}
        </ChatText>
      </View>
    );
  },
);

CheermoteToken.displayName = 'CheermoteToken';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  fallbackText: {
    opacity: 0.8,
  },
  moderated: {
    opacity: 0.4,
  },
});
