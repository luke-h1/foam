import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/text/text';
import type { MessageToken } from '@app/utils/chat/message-token';

import { ChatInlineImage } from './chat-inline-image';

interface CheermoteTokenProps {
  disableAnimations?: boolean;
  isModerated?: boolean;
  token: MessageToken<'cheermote'>;
  targetSize?: number;
}

export const CheermoteToken = memo(
  ({
    token,
    disableAnimations = false,
    isModerated = false,
    targetSize = 30,
  }: CheermoteTokenProps) => {
    const sourceUrl = disableAnimations
      ? token.cheermote.static_url || token.cheermote.url
      : token.cheermote.url || token.cheermote.static_url;

    if (!sourceUrl) {
      return <Text style={styles.fallbackText}>{token.content}</Text>;
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
        <Text type='xs' weight='bold' style={{ color: token.cheermote.color }}>
          {token.cheermote.bits}
        </Text>
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
