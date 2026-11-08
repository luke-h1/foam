import { useMemo } from 'react';
import type { RefObject } from 'react';

import { buildRawTwitchPlayerUrl } from '../util/twitch-player-source/buildRawTwitchPlayerUrl';
import {
  buildStreamPlayerInjectedJavaScript,
  buildTwitchAuthHelperScript,
} from '../util/twitch-player-source/buildStreamPlayerInjectedJavaScript';
import { buildTwitchClipPlayerUrl } from '../util/twitch-player-source/buildTwitchClipPlayerUrl';
import { buildTwitchPlayerAudioDefaultScript } from '../util/twitch-player-source/buildTwitchPlayerAudioDefaultScript';
import { buildTwitchPlayerQualityDefaultScript } from '../util/twitch-player-source/buildTwitchPlayerQualityDefaultScript';

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
    // oxlint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps -- resumeTimeRef is read on purpose, see docs/react-doctor.md
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
