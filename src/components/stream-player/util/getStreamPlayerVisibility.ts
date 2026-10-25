interface GetStreamPlayerVisibilityOptions {
  clip: string | undefined;
  deferOverlayUntilUserUnmute: boolean;
  hasContentGate: boolean;
  isPlayerReady: boolean;
  overlayUnlocked: boolean;
  posterUrl: string | undefined;
  showOverlayControls: boolean;
  video: string | undefined;
}

/**
 * Which layers the player draws. Twitch's own embed controls and the app's
 * native controls are mutually exclusive, so both flags come from one place.
 */
export function getStreamPlayerVisibility({
  clip,
  deferOverlayUntilUserUnmute,
  hasContentGate,
  isPlayerReady,
  overlayUnlocked,
  posterUrl,
  showOverlayControls,
  video,
}: GetStreamPlayerVisibilityOptions) {
  const allowsTwitchInteraction =
    Boolean(clip) || !showOverlayControls || hasContentGate;

  return {
    allowsTwitchInteraction,

    // Live rows wait for the bridge's own playback signal before they count
    // the WebView as started.
    awaitBridgePlaybackStart: showOverlayControls && !clip,

    /**
     * Thumbnail behind a transparent WebView so the iOS rotation snapshot shows
     * the poster, not the WebView's black backing. Live only.
     */
    showBehindThumbnail: Boolean(posterUrl) && !clip && !video,

    showNativeControls:
      showOverlayControls &&
      !clip &&
      !allowsTwitchInteraction &&
      isPlayerReady &&
      (!deferOverlayUntilUserUnmute || overlayUnlocked),
  };
}
