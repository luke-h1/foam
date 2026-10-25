import type { PlayerBridgeContext } from '@app/components/stream-player/util/playerBridgeInterpreter';

export function createBridgeContext(
  overrides: Partial<PlayerBridgeContext> = {},
): PlayerBridgeContext {
  return {
    autoplay: true,
    channel: 'sodapoppin',
    deferOverlayUntilUserUnmute: false,
    enhancedStabilityEnabled: true,
    lastPublishedLatencySeconds: null,
    mountedAtMs: 1000,
    nowMs: 3500,
    reportedFirstPlaying: false,
    reportedPlaybackBlocked: false,
    userPaused: false,
    ...overrides,
  };
}
