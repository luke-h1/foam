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

import {
  Image as ExpoImage,
  type ImageErrorEventData,
  type ImageRef,
} from 'expo-image';

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
 * Failed loads walk the format/size fallback chain, then backoff-retry the
 * smallest candidate; after this many attempts a static placeholder stays.
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
  priority?: 'low' | 'normal' | 'high';
  resizeMode?: 'contain' | 'cover' | 'stretch';
  sourceUrl: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
  transitionMs?: number;
}

// eslint-disable-next-line react-doctor/no-giant-component -- a split adds a mount boundary on the hottest chat path
function ChatInlineImageComponent({
  containerStyle,
  priority = 'high',
  resizeMode = 'contain',
  sourceUrl,
  style,
  testID,
  transitionMs = 100,
}: ChatInlineImageProps) {
  const sharedRef = useCachedEmote(sourceUrl);

  const rowVisibility = use(RowVisibilityContext);
  // The native isAnimated getter is a JSI hop per render; the url already
  // encodes the kind for everything but BTTV's bare url form.
  const urlKind = useMemo(() => describeEmoteUrl(sourceUrl).kind, [sourceUrl]);
  const animated =
    urlKind === null ? sharedRef?.isAnimated === true : urlKind === 'animated';
  const imageRef = useRef<ExpoImage>(null);

  const syncAnimation = useCallback(() => {
    if (!rowVisibility || !animated) {
      return;
    }
    const shouldAnimate =
      rowVisibility.isVisible() && !chatScrollActivity.isActive();
    runAnimationCommand(
      imageRef.current,
      shouldAnimate ? 'startAnimating' : 'stopAnimating',
    );
  }, [rowVisibility, animated]);

  const fallbackChain = useMemo(
    () => buildImageFallbackChain(sourceUrl),
    [sourceUrl],
  );

  const [reloadNonce, setReloadNonce] = useState(0);
  // Load progress tagged with url and render path (`viaRef`): a recycled or
  // cache-dropped row's tag stops matching, so it derives a fresh state.
  const [load, setLoad] = useState<{
    index: number;
    status: 'loading' | 'loaded' | 'failed';
    url: string;
    viaRef: boolean;
  }>({ index: 0, status: 'loading', url: sourceUrl, viaRef: false });
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [failedRefUrl, setFailedRefUrl] = useState<string | null>(null);
  // The exact ref instance that has drawn (onDisplay); held in a ref so the
  // healthy path never re-renders. The url-change effect clears it.
  const displayedSharedRef = useRef<ImageRef | null>(null);

  const showRef = sharedRef != null && failedRefUrl !== sourceUrl;
  const isCurrentUrl = load.url === sourceUrl && load.viaRef === showRef;
  const candidateIndex = !showRef && isCurrentUrl ? load.index : 0;
  const status = isCurrentUrl ? load.status : 'loading';

  const candidateUrl =
    fallbackChain[candidateIndex] ?? fallbackChain[0] ?? sourceUrl;

  // A ban belongs to the mount that issued it; without this reset a recycled
  // slot keeps an old ban.
  // eslint-disable-next-line react-doctor/rerender-state-only-in-handlers, react-doctor/no-derived-useState -- reset-state-on-prop-change pattern; the render-phase setState is the point
  const [banOwnerUrl, setBanOwnerUrl] = useState(sourceUrl);
  if (banOwnerUrl !== sourceUrl) {
    setBanOwnerUrl(sourceUrl);
    setFailedRefUrl(null);
  }

  // retryCountRef isn't rendered, so reset it here rather than during render.
  // A recycled slot's ref has not drawn yet even when still cached.
  useEffect(() => {
    retryCountRef.current = 0;
    displayedSharedRef.current = null;
  }, [sourceUrl]);

  // Drop the previous url's retry timer, or it reloads the wrong emote.
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
      viaRef: showRef,
    }));
    syncAnimation();
  }, [showRef, sourceUrl, syncAnimation]);

  const handleError = useCallback(
    (event?: ImageErrorEventData) => {
      if (showRef) {
        // A ref never fires onError, so this is the watchdog or a stale uri
        // operation; acting on a drawn ref would ban a healthy ref mid-display.
        if (sharedRef != null && displayedSharedRef.current === sharedRef) {
          return;
        }
        // The ref never drew, which says nothing about the url - hand off to
        // the fallback chain with a full budget.
        setFailedRefUrl(sourceUrl);
        retryCountRef.current = 0;
        setLoad({ index: 0, status: 'loading', url: sourceUrl, viaRef: false });
        setReloadNonce(nonce => nonce + 1);
        return;
      }

      if (candidateIndex === 0) {
        evictCachedEmoteRef(candidateUrl);
      }

      // The variant is unavailable (typically a 404 on a variant 7TV
      // advertises but never serves) - move to the next candidate immediately.
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
          viaRef: false,
        });
        return;
      }

      // Every variant 404'd - backoff-retry the smallest candidate to ride
      // out a transient blip.
      if (retryCountRef.current >= MAX_RELOAD_ATTEMPTS) {
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
        setLoad({
          index: candidateIndex,
          status: 'failed',
          url: sourceUrl,
          viaRef: false,
        });
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
      sharedRef,
      showRef,
      sourceUrl,
    ],
  );

  // A SharedRef source fires only onDisplay, never onLoad or onError, so this
  // marker is the ref path's sole liveness signal.
  const handleDisplay = useCallback(() => {
    if (showRef) {
      displayedSharedRef.current = sharedRef;
    }
    syncAnimation();
  }, [sharedRef, showRef, syncAnimation]);

  // A displayed ref pins status at 'loading' (no onLoad), so the timer always
  // fires on the ref path; handleError's displayed-ref guard no-ops it.
  const onWatchdogTimeout = useEffectEvent(() => handleError());
  useEffect(() => {
    if (status !== 'loading') {
      return undefined;
    }
    const timer = setTimeout(onWatchdogTimeout, LOAD_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [showRef, status, candidateUrl, reloadNonce]);

  useEffect(() => {
    if (!rowVisibility || !animated) {
      return;
    }
    syncAnimation();
    const unsubscribeVisibility = rowVisibility.subscribe(syncAnimation);
    const unsubscribeScroll = chatScrollActivity.subscribe(syncAnimation);
    return () => {
      unsubscribeVisibility();
      unsubscribeScroll();
    };
  }, [rowVisibility, animated, syncAnimation]);

  // Shimmer only while nothing real is on screen; cached emotes stay on the
  // bare-image fast path with no extra Fabric node.
  const overlayVisible = !showRef && status !== 'loaded';

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
      // Keep the transient uri branch out of expo-image's memory cache to
      // avoid a second decoded-bitmap pool beside our ImageRef cache.
      cachePolicy={showRef ? 'memory-disk' : 'disk'}
      useAppleWebpCodec={resolveUseAppleWebpCodec(urlKind)}
      priority={priority}
      transition={transitionMs}
      onDisplay={handleDisplay}
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
