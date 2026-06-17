import { memo, type ReactElement } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { useCachedEmote } from '@app/Providers/CachedEmotesProvider/useCachedEmote';
import {
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';

interface ChatInlineImageProps {
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  sourceUrl: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
}

function ChatInlineImageComponent({
  containerStyle,
  resizeMode = 'contain',
  sourceUrl,
  style,
  testID,
}: ChatInlineImageProps) {
  // Shared, size-capped decoded ref (decode-once across all rows showing this
  // image), null until decoded — falls back to the url so the first occurrence
  // still shows (expo-image memory+disk caches the url too).
  const sharedRef = useCachedEmote(sourceUrl);

  const imageElement: ReactElement = (
    <ExpoImage
      source={sharedRef ?? { uri: sourceUrl }}
      contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode}
      recyclingKey={sourceUrl}
      cachePolicy='memory-disk'
      priority='high'
      transition={0}
      style={style}
      testID={testID}
    />
  );

  if (!containerStyle) {
    return imageElement;
  }

  return <View style={containerStyle}>{imageElement}</View>;
}

export const ChatInlineImage = memo(ChatInlineImageComponent);
