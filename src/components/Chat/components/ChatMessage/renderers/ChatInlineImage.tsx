import {
  memo,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Image as ExpoImage } from 'expo-image';
import { useCachedEmote } from '@app/Providers/CachedEmotesProvider/useCachedEmote';
import { evictCachedEmoteRef } from '@app/Providers/CachedEmotesProvider/cache-service';
import {
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { RowVisibilityContext } from '../rowVisibility';

const CHAT_IMAGE_SKELETON = { blurhash: 'A0CsjpfQfQfQ' };

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

  const [reloadNonce, setReloadNonce] = useState(0);
  const attemptsRef = useRef({ url: sourceUrl, count: 0 });
  const handleError = useCallback(() => {
    const attempts = attemptsRef.current;
    if (attempts.url !== sourceUrl) {
      attempts.url = sourceUrl;
      attempts.count = 0;
    }
    if (attempts.count >= 2) {
      return;
    }
    attempts.count += 1;
    evictCachedEmoteRef(sourceUrl);
    setReloadNonce(nonce => nonce + 1);
  }, [sourceUrl]);

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
      recyclingKey={`${sourceUrl}#${reloadNonce}`}
      autoplay={rowVisibility && animated ? rowVisibility.isVisible() : true}
      cachePolicy='memory-disk'
      priority='high'
      placeholder={CHAT_IMAGE_SKELETON}
      placeholderContentFit='cover'
      transition={100}
      onError={handleError}
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
