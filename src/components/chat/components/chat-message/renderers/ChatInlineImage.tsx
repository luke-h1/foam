import {
  type ContextType,
  memo,
  type ReactElement,
  type RefObject,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
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

import { useSyncRef } from '@app/hooks/use-sync-ref';
import {
  evictCachedEmoteRef,
  getCachedEmoteByteEstimate,
  getCachedEmoteStats,
  getEmoteDecodeTimeoutCount,
  getEmoteRefReleaseRaceCount,
} from '@app/lib/emote-cache/cacheService';
import { resolveUseAppleWebpCodec } from '@app/lib/expo-image/resolveUseAppleWebpCodec';
import { runAnimationCommand } from '@app/lib/expo-image/runAnimationCommand';
import { useCachedEmote } from '@app/providers/cached-emotes-provider/use-cached-emote';
import { describeEmoteUrl } from '@app/utils/emote/describeEmoteUrl';
import { logger } from '@app/utils/logger';

import { getEmoteUrlKind, getImageFallbackChain } from '../util/emoteUrlCache';
import { RowVisibilityContext } from '../util/rowVisibility';
import { ChatImageShimmer } from './ChatImageShimmer';

const MAX_RELOAD_ATTEMPTS = 8;

const RELOAD_BASE_DELAY_MS = 400;
const RELOAD_MAX_DELAY_MS = 8000;

const LOAD_WATCHDOG_MS = 12_000;

function shouldEmoteAnimate(
  rowVisibility: ContextType<typeof RowVisibilityContext>,
  animated: boolean,
): boolean {
  if (!rowVisibility || !animated) {
    return true;
  }

  return rowVisibility.isVisible();
}

// Each command is a sync main-thread hop, so send one only on a state change.
function useEmoteAnimationSync(
  imageRef: RefObject<ExpoImage | null>,
  rowVisibility: ContextType<typeof RowVisibilityContext>,
  animated: boolean,
) {
  const autoplay = shouldEmoteAnimate(rowVisibility, animated);
  const committedAutoplayRef = useSyncRef(autoplay);
  const viewAnimatingRef = useRef(autoplay);

  const syncAnimation = useCallback(() => {
    if (!rowVisibility || !animated) {
      return;
    }

    const shouldAnimate = shouldEmoteAnimate(rowVisibility, animated);

    if (shouldAnimate === viewAnimatingRef.current) {
      return;
    }

    viewAnimatingRef.current = shouldAnimate;

    runAnimationCommand(
      imageRef.current,
      shouldAnimate ? 'startAnimating' : 'stopAnimating',
    );
  }, [imageRef, rowVisibility, animated]);

  const syncAfterImageChange = useCallback(() => {
    viewAnimatingRef.current = committedAutoplayRef.current;
    syncAnimation();
  }, [committedAutoplayRef, syncAnimation]);

  useEffect(() => {
    if (!rowVisibility || !animated) {
      return;
    }

    syncAnimation();
    return rowVisibility.subscribe(syncAnimation);
  }, [rowVisibility, animated, syncAnimation]);

  return { autoplay, syncAfterImageChange };
}

function useEmoteLoadRecovery(
  sourceUrl: string,
  sharedRef: ImageRef | null,
  syncAfterImageChange: () => void,
) {
  const fallbackChain = getImageFallbackChain(sourceUrl);

  const [reloadNonce, setReloadNonce] = useState(0);

  const [load, setLoad] = useState<{
    index: number;
    status: 'loading' | 'loaded' | 'failed';
    url: string;
    viaRef: boolean;
  }>({ index: 0, status: 'loading', url: sourceUrl, viaRef: false });

  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [failedRefUrl, setFailedRefUrl] = useState<string | null>(null);

  const displayedSharedRef = useRef<ImageRef | null>(null);

  const showRef = sharedRef != null && failedRefUrl !== sourceUrl;
  const isCurrentUrl = load.url === sourceUrl && load.viaRef === showRef;
  const candidateIndex = !showRef && isCurrentUrl ? load.index : 0;
  const status = isCurrentUrl ? load.status : 'loading';

  const candidateUrl =
    fallbackChain[candidateIndex] ?? fallbackChain[0] ?? sourceUrl;

  const [banOwnerUrl, setBanOwnerUrl] = useState(sourceUrl);

  if (banOwnerUrl !== sourceUrl) {
    setBanOwnerUrl(sourceUrl);
    setFailedRefUrl(null);

    setLoad({ index: 0, status: 'loading', url: sourceUrl, viaRef: false });
  }

  // Layout phase, not render: the new url's onDisplay can beat a passive effect.
  useLayoutEffect(() => {
    retryCountRef.current = 0;
    displayedSharedRef.current = null;
  }, [sourceUrl]);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearRetryTimer, [sourceUrl, clearRetryTimer]);

  const showRefRef = useSyncRef(showRef);

  const handleLoad = useCallback(() => {
    clearRetryTimer();
    retryCountRef.current = 0;

    setLoad(prev => ({
      index: prev.url === sourceUrl ? prev.index : 0,
      status: 'loaded',
      url: sourceUrl,
      viaRef: showRef,
    }));

    syncAfterImageChange();
  }, [clearRetryTimer, showRef, sourceUrl, syncAfterImageChange]);

  const handleError = useCallback(
    (event?: ImageErrorEventData) => {
      // A ref never fires onError, so this is the watchdog or a stale uri;
      // acting on a drawn ref would ban a healthy ref mid-display.
      const isDrawnRef =
        showRef &&
        sharedRef != null &&
        displayedSharedRef.current === sharedRef;

      if (isDrawnRef) {
        return;
      }

      if (showRef) {
        clearRetryTimer();

        setFailedRefUrl(sourceUrl);
        retryCountRef.current = 0;
        setLoad({ index: 0, status: 'loading', url: sourceUrl, viaRef: false });
        setReloadNonce(nonce => nonce + 1);
        return;
      }

      if (event !== undefined && candidateIndex === 0) {
        evictCachedEmoteRef(candidateUrl);
      }

      // Variant 404'd (7TV advertises it but never serves) or stalled - next.
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

      if (retryCountRef.current >= MAX_RELOAD_ATTEMPTS) {
        logEmoteLoadFailure({
          attempts: retryCountRef.current,
          candidateIndex,
          candidateUrl,
          event,
          sourceUrl,
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

      clearRetryTimer();

      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        if (!showRefRef.current) {
          setReloadNonce(nonce => nonce + 1);
        }
      }, delay);
    },
    [
      candidateIndex,
      candidateUrl,
      clearRetryTimer,
      fallbackChain,
      sharedRef,
      showRef,
      showRefRef,
      sourceUrl,
    ],
  );

  // A SharedRef fires only onDisplay, so it is the ref path's sole liveness
  // signal.
  const handleDisplay = useCallback(() => {
    if (showRef) {
      displayedSharedRef.current = sharedRef;
    }

    syncAfterImageChange();
  }, [sharedRef, showRef, syncAfterImageChange]);

  // A displayed ref pins status at 'loading', so the timer always fires on the
  // ref path and handleError's drawn-ref guard no-ops it. Synced ref, not
  // useEffectEvent: the test renderer never updates it, so a recycled row would
  // fire its first url's handler.
  const handleErrorRef = useSyncRef(handleError);

  useEffect(() => {
    if (status !== 'loading') {
      return undefined;
    }

    const timer = setTimeout(() => handleErrorRef.current(), LOAD_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [handleErrorRef, showRef, status, candidateUrl, reloadNonce, sourceUrl]);

  return {
    candidateUrl,
    handleDisplay,
    handleError,
    handleLoad,
    reloadNonce,
    showRef,
    status,
  };
}

interface LogEmoteLoadFailureOptions {
  attempts: number;
  candidateIndex: number;
  candidateUrl: string;
  event: ImageErrorEventData | undefined;
  sourceUrl: string;
}

function logEmoteLoadFailure({
  attempts,
  candidateIndex,
  candidateUrl,
  event,
  sourceUrl,
}: LogEmoteLoadFailureOptions): void {
  const descriptor = describeEmoteUrl(candidateUrl);
  const cache = getCachedEmoteStats();

  logger.chat.warn('chat.emote.load_failed', {
    name: 'chat_resources_warning',
    error: event?.error,
    failure: event === undefined ? 'timeout' : 'error',
    url: sourceUrl,
    finalUrl: candidateUrl,
    candidatesTried: candidateIndex + 1,
    attempts,
    renderPath: 'uri',
    tags: {
      emoteProvider: descriptor.provider,
      emoteScale: descriptor.scale,
      emoteKind: descriptor.kind,
      cacheDecoded: cache.decoded,
      cacheInflight: cache.inflight,
      cachePinned: cache.pinned,
      cacheBytes: getCachedEmoteByteEstimate(),
      cacheReleaseRaces: getEmoteRefReleaseRaceCount(),
      cacheDecodeTimeouts: getEmoteDecodeTimeoutCount(),
    },
  });
}

interface ChatInlineImageProps {
  accessibilityLabel?: string;
  onTouchStart?: () => void;
  playAnimation?: boolean;
  priority?: 'low' | 'normal' | 'high';
  sourceUrl: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
  transitionMs?: number;
}

function ChatInlineImageComponent({
  accessibilityLabel,
  onTouchStart,
  priority = 'high',
  sourceUrl,
  style,
  playAnimation = true,
  testID,
  transitionMs = 100,
}: ChatInlineImageProps) {
  const sharedRef = useCachedEmote(sourceUrl);

  const rowVisibility = use(RowVisibilityContext);

  // isAnimated is a JSI hop per render; the url encodes the kind for all but
  // BTTV's bare url form.
  const urlKind = getEmoteUrlKind(sourceUrl);

  const animated =
    urlKind === null ? sharedRef?.isAnimated === true : urlKind === 'animated';

  const shouldAnimate = animated && playAnimation;

  const imageRef = useRef<ExpoImage>(null);

  // Recycle blank-emote: same url, cache swaps the ImageRef under it, key stays
  // equal, ref path (no shimmer) keeps the stale ref and draws blank. Remount on
  // a live->live swap: iOS can apply the new recyclingKey after the new source
  // and clear it. null->ref and ref->null re-key through candidateUrl.
  const [refTracker, setRefTracker] = useState({
    ref: sharedRef,
    generation: 0,
  });

  if (refTracker.ref !== sharedRef) {
    setRefTracker(previous => ({
      ref: sharedRef,
      generation:
        previous.ref != null && sharedRef != null
          ? previous.generation + 1
          : previous.generation,
    }));
  }

  const refGeneration = refTracker.generation;

  // Two of the same emote in one message share a ref and so the same
  // candidateUrl; a stable per-instance id keeps their recyclingKeys distinct,
  // or the recycle pool collides them and one draws blank.
  const instanceId = useId();

  const { autoplay, syncAfterImageChange } = useEmoteAnimationSync(
    imageRef,
    rowVisibility,
    shouldAnimate,
  );

  const {
    candidateUrl,
    handleDisplay,
    handleError,
    handleLoad,
    reloadNonce,
    showRef,
    status,
  } = useEmoteLoadRecovery(sourceUrl, sharedRef, syncAfterImageChange);

  const overlayVisible = !showRef && status !== 'loaded';

  const source = showRef ? sharedRef : { uri: candidateUrl };

  const imageElement: ReactElement = (
    <ExpoImage
      key={refGeneration}
      ref={imageRef}
      source={source}
      contentFit='contain'
      recyclingKey={`${candidateUrl}#${reloadNonce}#${refGeneration}#${instanceId}`}
      autoplay={playAnimation && autoplay}
      cachePolicy={showRef ? 'memory-disk' : 'disk'}
      useAppleWebpCodec={resolveUseAppleWebpCodec(urlKind)}
      priority={priority}
      transition={transitionMs}
      onDisplay={handleDisplay}
      onLoad={handleLoad}
      onError={handleError}
      style={overlayVisible ? StyleSheet.absoluteFill : style}
      {...{
        accessible: accessibilityLabel ? true : undefined,
        accessibilityLabel,
        onTouchStart: overlayVisible ? undefined : onTouchStart,
        testID,
      }}
    />
  );

  if (overlayVisible) {
    return (
      <View
        onTouchStart={onTouchStart}
        // SAFETY: overlay host uses ViewStyle only; ImageStyle extras unused.
        style={style as StyleProp<ViewStyle>}
      >
        <ChatImageShimmer animate={status === 'loading'} />
        {imageElement}
      </View>
    );
  }

  return imageElement;
}

export const ChatInlineImage = memo(ChatInlineImageComponent);
