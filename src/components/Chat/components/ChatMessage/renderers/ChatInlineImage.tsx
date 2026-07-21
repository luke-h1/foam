import {
  memo,
  type ReactElement,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';

import { chatScrollActivity } from '@app/components/Chat/util/chatScrollActivity';
import { resolveUseAppleWebpCodec } from '@app/lib/expo-image/resolveUseAppleWebpCodec';
import { runAnimationCommand } from '@app/lib/expo-image/runAnimationCommand';
import {
  evictCachedEmoteRef,
  getCachedEmoteByteEstimate,
  getCachedEmoteStats,
  getEmoteRefReleaseRaceCount,
} from '@app/Providers/CachedEmotesProvider/cache-service';
import { useCachedEmote } from '@app/Providers/CachedEmotesProvider/useCachedEmote';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import { buildImageFallbackChain } from '@app/utils/emote/imageFallbackChain';
import { logger } from '@app/utils/logger';

import { RowVisibilityContext } from '../rowVisibility';
import { ChatImageShimmer } from './ChatImageShimmer';

/**
 * A failed load is handled in two stages. First we walk the format/size
 * fallback chain (webp -> avif, 4x -> 1x): 7TV often advertises a variant its
 * CDN doesn't actually serve, so the original 404s but a smaller size or the
 * other format loads fine - try those immediately rather than hammering the
 * dead URL. Only once every variant is exhausted do we fall back to a patient
 * backoff retry of the smallest candidate, to ride out a transient network blip
 * (common during raids/floods) without stranding the emote as a dead grey box.
 * After this many backoff attempts we give up and leave a static placeholder.
 */
const MAX_RELOAD_ATTEMPTS = 8;
const RELOAD_BASE_DELAY_MS = 400;
const RELOAD_MAX_DELAY_MS = 8000;
/**
 * Route silent hangs (no onLoad/onError) through the error path after this long.
 */
const LOAD_WATCHDOG_MS = 12000;

interface ChatInlineImageProps {
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Max backoff-retry attempts after the whole fallback chain is exhausted.
   * Defaults to {@link MAX_RELOAD_ATTEMPTS} for emote URLs whose CDN variants
   * routinely have transient flakiness worth riding out. Callers rendering
   * assets with stable, single-URL sources (e.g. badges) can pass `0` to fail
   * immediately and stop the ~36s of on-screen "loading" state that a dead URL
   * would otherwise produce.
   */
  maxRetryAttempts?: number;
  priority?: 'low' | 'normal' | 'high';
  resizeMode?: 'contain' | 'cover' | 'stretch';
  /**
   * When `false`, no shimmer is rendered while the image is loading - the slot
   * just stays empty until the image resolves or is given up on. Use for tiny
   * assets (badges) where a pulsing box is more distracting than helpful.
   *
   * @default true
   */
  showLoadingShimmer?: boolean;
  sourceUrl: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
  transitionMs?: number;
}

function ChatInlineImageComponent({
  containerStyle,
  maxRetryAttempts = MAX_RELOAD_ATTEMPTS,
  priority = 'high',
  resizeMode = 'contain',
  showLoadingShimmer = true,
  sourceUrl,
  style,
  testID,
  transitionMs = 100,
}: ChatInlineImageProps) {
  const sharedRef = useCachedEmote(sourceUrl);

  const fallbackChain = useMemo(
    () => buildImageFallbackChain(sourceUrl),
    [sourceUrl],
  );

  const [reloadNonce, setReloadNonce] = useState(0);
  /**
   * Per-emote load progress, tagged with the url it belongs to. When LegendList
   * recycles the row to a new emote the tag stops matching, so we derive a fresh
   * "first candidate, loading" view until a handler writes the new url back. This
   * avoids both a frame showing the previous emote's fallback variant and any
   * render-phase setState to reset it.
   */
  const [load, setLoad] = useState<{
    index: number;
    status: 'loading' | 'loaded' | 'failed';
    url: string;
  }>({ index: 0, status: 'loading', url: sourceUrl });
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [failedRefUrl, setFailedRefUrl] = useState<string | null>(null);

  const isCurrentUrl = load.url === sourceUrl;
  const showRef = sharedRef != null && failedRefUrl !== sourceUrl;
  const candidateIndex = !showRef && isCurrentUrl ? load.index : 0;
  const status = isCurrentUrl ? load.status : 'loading';

  const candidateUrl =
    fallbackChain[candidateIndex] ?? fallbackChain[0] ?? sourceUrl;

  // retryCountRef isn't rendered, so reset it for a recycled emote here rather
  // than during render.
  useEffect(() => {
    retryCountRef.current = 0;
  }, [sourceUrl]);

  // Drop any retry timer scheduled for the previous url - it would otherwise
  // bump reloadNonce and reload the wrong emote - and on unmount.
  useEffect(
    () => () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    },
    [sourceUrl],
  );

  const handleLoad = useCallback(() => {
    retryCountRef.current = 0;
    setLoad(prev => ({
      index: prev.url === sourceUrl ? prev.index : 0,
      status: 'loaded',
      url: sourceUrl,
    }));
  }, [sourceUrl]);

  const handleError = useCallback(
    (event?: ImageErrorEventData) => {
      if (showRef) {
        setFailedRefUrl(sourceUrl);
      } else if (candidateIndex === 0) {
        evictCachedEmoteRef(candidateUrl);
      }

      /**
       * The current size/format is unavailable (typically a 404 on a variant
       * 7TV advertises but the CDN doesn't serve). Move to the next candidate -
       * alternate format first, then a smaller size - immediately, since it's a
       * genuinely different URL rather than the same dead one.
       */
      if (candidateIndex < fallbackChain.length - 1) {
        logger.chat.debug('chat.emote.fallback', {
          from: candidateUrl,
          to: fallbackChain[candidateIndex + 1],
        });
        retryCountRef.current = 0;
        setLoad({
          index: candidateIndex + 1,
          status: 'loading',
          url: sourceUrl,
        });
        return;
      }

      // Every format/size has 404'd. Patiently backoff-retry the smallest
      // candidate - the one most likely to exist - to ride out a transient blip.
      if (retryCountRef.current >= maxRetryAttempts) {
        const descriptor = describeEmoteUrl(candidateUrl);
        const cache = getCachedEmoteStats();
        logger.chat.warn('chat.emote.load_failed', {
          name: 'chat_resources_warning',
          error: event?.error,
          url: sourceUrl,
          finalUrl: candidateUrl,
          candidatesTried: fallbackChain.length,
          attempts: retryCountRef.current,
          renderPath: showRef ? 'imageRef' : 'uri',
          tags: {
            emoteProvider: descriptor.provider,
            emoteScale: descriptor.scale,
            emoteKind: descriptor.kind,
            cacheDecoded: cache.decoded,
            cacheInflight: cache.inflight,
            cachePinned: cache.pinned,
            cacheBytes: getCachedEmoteByteEstimate(),
            cacheReleaseRaces: getEmoteRefReleaseRaceCount(),
          },
        });
        setLoad({ index: candidateIndex, status: 'failed', url: sourceUrl });
        return;
      }

      retryCountRef.current += 1;
      logger.chat.debug('chat.emote.load_retry', {
        url: candidateUrl,
        attempt: retryCountRef.current,
      });
      const delay = Math.min(
        RELOAD_MAX_DELAY_MS,
        RELOAD_BASE_DELAY_MS * 2 ** (retryCountRef.current - 1),
      );
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        setReloadNonce(nonce => nonce + 1);
      }, delay);
    },
    [
      candidateIndex,
      candidateUrl,
      fallbackChain,
      maxRetryAttempts,
      showRef,
      sourceUrl,
    ],
  );

  const onWatchdogTimeout = useEffectEvent(() => handleError());
  useEffect(() => {
    if (showRef || status !== 'loading') {
      return undefined;
    }
    const timer = setTimeout(onWatchdogTimeout, LOAD_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [showRef, status, candidateUrl, reloadNonce]);

  const rowVisibility = use(RowVisibilityContext);
  // The native isAnimated getter is a JSI hop per render; the url already
  // encodes the kind for everything but BTTV's bare url form.
  const urlKind = useMemo(() => describeEmoteUrl(sourceUrl).kind, [sourceUrl]);
  const animated =
    sharedRef != null &&
    (urlKind === null ? sharedRef.isAnimated === true : urlKind === 'animated');
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

  /**
   * Show the shimmer only while there's nothing real to display yet: a decoded
   * sharedRef is instant, so cached emotes (the busy-chat common case) never
   * shimmer and stay on the bare-image fast path with no extra Fabric node.
   */
  const overlayVisible =
    showLoadingShimmer && sharedRef == null && status !== 'loaded';

  // Render the decoded sharedRef whenever it's available and hasn't failed to
  // display; otherwise render the current fallback variant's uri.
  const source = showRef ? sharedRef : { uri: candidateUrl };

  const imageElement: ReactElement = (
    <ExpoImage
      ref={imageRef}
      source={source}
      contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode}
      recyclingKey={`${candidateUrl}#${reloadNonce}`}
      autoplay={
        rowVisibility && animated
          ? rowVisibility.isVisible() && !chatScrollActivity.isActive()
          : true
      }
      /**
       * The durable decoded copy lives in our own ImageRef cache (the `showRef`
       * path). The `uri` fallback branch is transient (first occurrence / a
       * failed ref), so keep it out of expo-image's in-memory cache to avoid a
       * second session-long decoded-bitmap pool on top of the ImageRef cache.
       */
      cachePolicy={showRef ? 'memory-disk' : 'disk'}
      useAppleWebpCodec={resolveUseAppleWebpCodec(urlKind)}
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
