interface GetLiveStreamVisibilityOptions {
  isChatConnectionReady: boolean;
  isChatEnabled: boolean;
  isFocused: boolean;
  isStreamEnabled: boolean;
  isStreamRequestError: boolean;
  isStreamRequestSuccess: boolean;
  resolvedChannelId: string | undefined;
  resolvedChannelLogin: string;
  shouldRenderChat: boolean;
  stream: unknown;
}

/**
 * What the live-stream screen should have on screen right now. Every flag here
 * is derived from the same handful of inputs, so they are worked out together
 * rather than re-combined at each use site.
 */
export function getLiveStreamVisibility({
  isChatConnectionReady,
  isChatEnabled,
  isFocused,
  isStreamEnabled,
  isStreamRequestError,
  isStreamRequestSuccess,
  resolvedChannelId,
  resolvedChannelLogin,
  shouldRenderChat,
  stream,
}: GetLiveStreamVisibilityOptions) {
  const hasResolvedChannelLogin = Boolean(resolvedChannelLogin);
  const hasResolvedChannelId = Boolean(resolvedChannelId);

  const shouldShowChatConnectionNotice =
    isFocused &&
    isStreamEnabled &&
    shouldRenderChat &&
    hasResolvedChannelLogin &&
    (!hasResolvedChannelId || !isChatConnectionReady);

  // A channel that resolved to no stream is offline; a failed request is an
  // error. Both replace the player with the unavailable panel.
  const isChannelOffline =
    isStreamEnabled && isStreamRequestSuccess && stream === undefined;

  const isStreamUnavailable =
    isChannelOffline || (isStreamEnabled && isStreamRequestError);

  const shouldLoadChannelEngagement =
    isFocused && isStreamEnabled && hasResolvedChannelId;

  return {
    isChannelOffline,
    isStreamUnavailable,
    predictionChannelId: shouldLoadChannelEngagement
      ? resolvedChannelId
      : undefined,
    shouldMountChat:
      isFocused &&
      shouldRenderChat &&
      hasResolvedChannelLogin &&
      hasResolvedChannelId &&
      isChatConnectionReady,
    shouldRenderChatPanel:
      isChatEnabled && (shouldRenderChat || shouldShowChatConnectionNotice),
    shouldRenderStreamPlayer:
      isFocused &&
      isStreamEnabled &&
      hasResolvedChannelLogin &&
      !isStreamUnavailable,
    shouldShowChatConnectionNotice,
  };
}
