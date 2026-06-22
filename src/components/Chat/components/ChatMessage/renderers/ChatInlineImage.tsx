import {
  memo,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';
import { logger } from '@app/utils/logger';
import { useCachedEmote } from '@app/Providers/CachedEmotesProvider/useCachedEmote';
import { evictCachedEmoteRef } from '@app/Providers/CachedEmotesProvider/cache-service';
import {
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  StyleSheet,
  View,
} from 'react-native';
import { RowVisibilityContext } from '../rowVisibility';
import { chatScrollActivity } from '@app/components/Chat/util/chatScrollActivity';
import { ChatImageShimmer } from './ChatImageShimmer';

// Keep retrying a failed load on a backoff so a transient network blip (common
// during raids/floods) doesn't strand an emote as a dead grey box forever, while
// still being gentle enough not to hammer the network. After this many attempts
// we give up and leave a static grey placeholder.
const MAX_RELOAD_ATTEMPTS = 4;
const RELOAD_BASE_DELAY_MS = 400;
const RELOAD_MAX_DELAY_MS = 8000;

// expo-image's startAnimating/stopAnimating are async native calls. Once
// LegendList recycles a row's view out from under the ref they reject with
// "Unable to find the 'ImageView' view with tag" — and because the callers
// fire-and-forget, that became an unhandled rejection (FOAM-TV-MOBILE-AH). A
// detached view has nothing to animate, so swallow it.
function runAnimationCommand(
  image: ExpoImage | null,
  command: 'startAnimating' | 'stopAnimating',
): void {
  try {
    const result = image?.[command]?.() as Promise<unknown> | undefined;
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch {
    // synchronous throw from an already-detached view — same story
  }
}

interface ChatInlineImageProps {
  containerStyle?: StyleProp<ViewStyle>;
  priority?: 'low' | 'normal' | 'high';
  resizeMode?: 'contain' | 'cover' | 'stretch';
  sourceUrl: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
  transitionMs?: number;
}

function ChatInlineImageComponent({
  containerStyle,
  priority = 'high',
  resizeMode = 'contain',
  sourceUrl,
  style,
  testID,
  transitionMs = 100,
}: ChatInlineImageProps) {
  // Shared, size-capped decoded ref (decode-once across all rows showing this
  // image), null until decoded — falls back to the url so the first occurrence
  // still shows (expo-image memory+disk caches the url too).
  const sharedRef = useCachedEmote(sourceUrl);

  const [reloadNonce, setReloadNonce] = useState(0);
  // 'loading' until the url-fallback reports onLoad, 'loaded' once it has, or
  // 'failed' after we exhaust retries. Drives the shimmer overlay below. A
  // decoded sharedRef is already a guaranteed bitmap, so it counts as loaded.
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(
    'loading',
  );
  const attemptsRef = useRef({ url: sourceUrl, count: 0 });
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    },
    [],
  );

  const handleLoad = useCallback(() => {
    attemptsRef.current.count = 0;
    setStatus('loaded');
  }, []);

  const handleError = useCallback(
    (event?: ImageErrorEventData) => {
      const attempts = attemptsRef.current;
      if (attempts.url !== sourceUrl) {
        attempts.url = sourceUrl;
        attempts.count = 0;
      }
      if (attempts.count >= MAX_RELOAD_ATTEMPTS) {
        logger.chat.warn('chat.emote.load_failed', {
          name: 'chat_resources_warning',
          error: event?.error,
          url: sourceUrl,
          attempts: attempts.count,
        });
        setStatus('failed');
        return;
      }
      attempts.count += 1;
      logger.chat.debug('chat.emote.load_retry', {
        url: sourceUrl,
        attempt: attempts.count,
      });
      evictCachedEmoteRef(sourceUrl);
      const delay = Math.min(
        RELOAD_MAX_DELAY_MS,
        RELOAD_BASE_DELAY_MS * 2 ** (attempts.count - 1),
      );
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => {
        setReloadNonce(nonce => nonce + 1);
      }, delay);
    },
    [sourceUrl],
  );

  const rowVisibility = use(RowVisibilityContext);
  const animated = sharedRef?.isAnimated === true;
  const imageRef = useRef<ExpoImage>(null);
  useEffect(() => {
    if (!rowVisibility || !animated) {
      return;
    }
    const apply = (): void => {
      const shouldAnimate =
        rowVisibility.isVisible() && !chatScrollActivity.isActive();
      runAnimationCommand(
        imageRef.current,
        shouldAnimate ? 'startAnimating' : 'stopAnimating',
      );
    };
    if (!(rowVisibility.isVisible() && !chatScrollActivity.isActive())) {
      runAnimationCommand(imageRef.current, 'stopAnimating');
    }
    const unsubscribeVisibility = rowVisibility.subscribe(apply);
    const unsubscribeScroll = chatScrollActivity.subscribe(apply);
    return () => {
      unsubscribeVisibility();
      unsubscribeScroll();
    };
  }, [rowVisibility, animated]);

  // Show the shimmer only while there's nothing real to display yet: a decoded
  // sharedRef is instant, so cached emotes (the busy-chat common case) never
  // shimmer and stay on the bare-image fast path with no extra Fabric node.
  const overlayVisible = sharedRef == null && status !== 'loaded';

  const imageElement: ReactElement = (
    <ExpoImage
      ref={imageRef}
      source={sharedRef ?? { uri: sourceUrl }}
      contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode}
      recyclingKey={`${sourceUrl}#${reloadNonce}`}
      autoplay={
        rowVisibility && animated
          ? rowVisibility.isVisible() && !chatScrollActivity.isActive()
          : true
      }
      cachePolicy='memory-disk'
      priority={priority}
      transition={transitionMs}
      onLoad={handleLoad}
      onError={handleError}
      style={overlayVisible ? StyleSheet.absoluteFill : style}
      testID={testID}
    />
  );

  if (containerStyle) {
    return (
      <View style={containerStyle}>
        {overlayVisible ? (
          <ChatImageShimmer animate={status === 'loading'} />
        ) : null}
        {imageElement}
      </View>
    );
  }

  if (overlayVisible) {
    return (
      <View style={style}>
        <ChatImageShimmer animate={status === 'loading'} />
        {imageElement}
      </View>
    );
  }

  return imageElement;
}

export const ChatInlineImage = memo(ChatInlineImageComponent);
