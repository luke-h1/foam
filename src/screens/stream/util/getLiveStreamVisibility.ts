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

  const isChannelOffline =
    isStreamEnabled && isStreamRequestSuccess && stream == null;

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
