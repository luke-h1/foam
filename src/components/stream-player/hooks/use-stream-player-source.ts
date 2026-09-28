import { useMemo } from 'react';
import type { RefObject } from 'react';

import { buildRawTwitchPlayerUrl } from '../util/twitch-player-source/build-raw-twitch-player-url';
import {
  buildStreamPlayerInjectedJavaScript,
  buildTwitchAuthHelperScript,
} from '../util/twitch-player-source/build-stream-player-injected-java-script';
import { buildTwitchClipPlayerUrl } from '../util/twitch-player-source/build-twitch-clip-player-url';
import { buildTwitchPlayerAudioDefaultScript } from '../util/twitch-player-source/build-twitch-player-audio-default-script';
import { buildTwitchPlayerQualityDefaultScript } from '../util/twitch-player-source/build-twitch-player-quality-default-script';

interface UseStreamPlayerSourceOptions {
  autoplay: boolean;
  channel: string | undefined;
  clip: string | undefined;
  embedParent: string;
  initialMuted: boolean;
  resumeTimeRef: RefObject<number>;
  showOverlayControls: boolean;
  video: string | undefined;
  webViewKey: number;
}

/**
 * The embed URL and the scripts injected into it. All of it is derived from
 * the source props, so it lives away from the player's own state.
 */
export function useStreamPlayerSource({
  autoplay,
  channel,
  clip,
  embedParent,
  initialMuted,
  resumeTimeRef,
  showOverlayControls,
  video,
  webViewKey,
}: UseStreamPlayerSourceOptions) {
  const channelName = channel || 'twitch';

  let contentKind: 'clip' | 'vod' | 'live' = 'live';

  if (clip) {
    contentKind = 'clip';
  } else if (video) {
    contentKind = 'vod';
  }

  /**
   * URL must only change on source change or remount (webViewKey) - an
   * incidental re-render would reload the WebView.
   */
  const webViewSource = useMemo(
    () =>
      clip
        ? {
            uri: buildTwitchClipPlayerUrl({
              clip,
              parent: embedParent,
              autoplay,
              muted: initialMuted,
            }),
          }
        : {
            uri: buildRawTwitchPlayerUrl({
              channel: channelName,
              video,
              parent: embedParent,
              autoplay,
              muted: initialMuted,
              timeSeconds: video ? resumeTimeRef.current : undefined,
            }),
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
    [clip, channelName, video, embedParent, autoplay, initialMuted, webViewKey],
  );

  const injectedJavaScriptBeforeContentLoaded = clip
    ? buildTwitchAuthHelperScript()
    : buildTwitchPlayerQualityDefaultScript({
        defaultQuality: '720p60',
        maxBitrateBps: 3_500_000,
      }) +
      '\n' +
      buildTwitchPlayerAudioDefaultScript({ muted: initialMuted });

  return {
    contentKind,
    injectedJavaScript: buildStreamPlayerInjectedJavaScript({
      autoplay,
      clip,
      initialMuted,
      showOverlayControls,
      video,
    }),
    injectedJavaScriptBeforeContentLoaded,
    webViewSource,
  };
}
