import type { PlayerBridgeContext } from '@app/components/stream-player/util/player-bridge-interpreter';

export function createBridgeContext(
  overrides: Partial<PlayerBridgeContext> = {},
): PlayerBridgeContext {
  return {
    autoplay: true,
    channel: 'sodapoppin',
    deferOverlayUntilUserUnmute: false,
    enhancedStabilityEnabled: true,
    lastPublishedLatencySeconds: null,
    mountedAtMs: 1_000,
    nowMs: 3_500,
    reportedFirstPlaying: false,
    reportedPlaybackBlocked: false,
    userPaused: false,
    ...overrides,
  };
}
