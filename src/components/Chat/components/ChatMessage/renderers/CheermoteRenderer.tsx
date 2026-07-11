import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatInlineImage } from './ChatInlineImage';

interface CheermoteRendererProps {
  disableAnimations?: boolean;
  isModerated?: boolean;
  part: ParsedPart<'cheermote'>;
  targetSize?: number;
}

export const CheermoteRenderer = memo(
  ({
    part,
    disableAnimations = false,
    isModerated = false,
    targetSize = 30,
  }: CheermoteRendererProps) => {
    const sourceUrl = disableAnimations
      ? part.cheermote.static_url || part.cheermote.url
      : part.cheermote.url || part.cheermote.static_url;

    if (!sourceUrl) {
      return <Text style={styles.fallbackText}>{part.content}</Text>;
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
        <Text type='xs' weight='bold' style={{ color: part.cheermote.color }}>
          {part.cheermote.bits}
        </Text>
      </View>
    );
  },
);

CheermoteRenderer.displayName = 'CheermoteRenderer';

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
