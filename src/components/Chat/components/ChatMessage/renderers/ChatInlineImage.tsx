import { memo, use, useEffect, useRef, type ReactElement } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { useCachedEmote } from '@app/Providers/CachedEmotesProvider/useCachedEmote';
import {
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { RowVisibilityContext } from '../rowVisibility';

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

  /**
   * Pause an animated emote only while its row is off-screen (still mounted in
   * LegendList's draw buffer). Static emotes/badges skip the gate.
   */
  const rowVisibility = use(RowVisibilityContext);
  const animated = sharedRef?.isAnimated === true;
  const imageRef = useRef<ExpoImage>(null);
  useEffect(() => {
    if (!rowVisibility || !animated) {
      return;
    }
    const apply = (visible: boolean): void => {
      if (visible) {
        void imageRef.current?.startAnimating?.();
      } else {
        void imageRef.current?.stopAnimating?.();
      }
    };
    // autoplay covers the visible mount; only enforce the paused state here.
    if (!rowVisibility.isVisible()) {
      apply(false);
    }
    return rowVisibility.subscribe(apply);
  }, [rowVisibility, animated]);

  const imageElement: ReactElement = (
    <ExpoImage
      ref={imageRef}
      source={sharedRef ?? { uri: sourceUrl }}
      contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode}
      recyclingKey={sourceUrl}
      autoplay={rowVisibility && animated ? rowVisibility.isVisible() : true}
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
