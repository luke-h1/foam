import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { fitWithinMaxBox } from '@app/utils/chat/calculateAspectRatio';
import { StyleSheet, View } from 'react-native';
import { ChatInlineImage } from '../renderers/ChatInlineImage';
import {
  DEFAULT_STAGE_SIZE,
  getChatAssetContextPreviewSize,
  LABEL_GAP,
  LABEL_LINE_HEIGHT,
  PREVIEW_PADDING,
} from './chatAssetContextPreviewLayout';

interface ChatAssetContextPreviewProps {
  cacheVariant: 'badge' | 'emote';
  label?: string;
  showLabel?: boolean;
  sourceHeight: number;
  sourceUrl?: string;
  sourceWidth: number;
  stageSize?: number;
}

export function ChatAssetContextPreview({
  cacheVariant,
  label,
  showLabel = true,
  sourceHeight,
  sourceUrl,
  sourceWidth,
  stageSize = DEFAULT_STAGE_SIZE,
}: ChatAssetContextPreviewProps) {
  const imageSize = fitWithinMaxBox(sourceWidth, sourceHeight, stageSize);
  const shouldShowLabel = showLabel && Boolean(label) && Boolean(sourceUrl);
  const previewSize = getChatAssetContextPreviewSize({
    showLabel: shouldShowLabel,
    stageSize,
  });

  return (
    <View style={[styles.container, previewSize]}>
      <View
        style={[styles.imageStage, { height: stageSize, width: stageSize }]}
      >
        {sourceUrl ? (
          <ChatInlineImage
            cacheVariant={cacheVariant}
            sourceUrl={sourceUrl}
            style={imageSize}
          />
        ) : label ? (
          <Text style={styles.fallbackLabel} weight='semibold'>
            {label}
          </Text>
        ) : null}
      </View>
      {shouldShowLabel ? (
        <Text
          color='gray.textLow'
          numberOfLines={1}
          style={[styles.caption, { maxWidth: stageSize }]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    lineHeight: LABEL_LINE_HEIGHT,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    gap: LABEL_GAP,
    justifyContent: 'center',
    padding: PREVIEW_PADDING,
  },
  fallbackLabel: {
    maxWidth: DEFAULT_STAGE_SIZE,
    textAlign: 'center',
  },
  imageStage: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
