export interface SyntheticChatConfig {
  active: boolean;
  // Sustained baseline throughput.
  msgPerSec: number;
  // Every `burstEveryMs`, emit `burstSize` at once to simulate raids and stress the batch-insert path.
  burstSize: number;
  burstEveryMs: number;
  // 0..1 share of messages that are pure emote spam (no words).
  emoteSpamRatio: number;
  // Average emotes per message.
  emotesPerMessage: number;
}

const OFF: SyntheticChatConfig = {
  active: false,
  msgPerSec: 0,
  burstSize: 0,
  burstEveryMs: 0,
  emoteSpamRatio: 0,
  emotesPerMessage: 0,
};

/**
 * Keyed by dev-tools / deep-link preset name, so an unrecognised key resolves to `undefined` rather than failing to compile.
 */
export interface SyntheticPresets {
  [presetKey: string]: SyntheticChatConfig;
}

export const SYNTHETIC_PRESETS: SyntheticPresets = {
  off: OFF,
  steady60: {
    active: true,
    msgPerSec: 60,
    burstSize: 0,
    burstEveryMs: 0,
    emoteSpamRatio: 0.4,
    emotesPerMessage: 3,
  },
  burst: {
    active: true,
    msgPerSec: 80,
    burstSize: 40,
    burstEveryMs: 1500,
    emoteSpamRatio: 0.6,
    emotesPerMessage: 4,
  },
  raid: {
    active: true,
    msgPerSec: 120,
    burstSize: 80,
    burstEveryMs: 1000,
    emoteSpamRatio: 0.75,
    emotesPerMessage: 5,
  },
};

type SyntheticChatControl = {
  current: SyntheticChatConfig;
};

export const syntheticChatControl: SyntheticChatControl = {
  current: OFF,
};

export function setSyntheticChatControl(config: SyntheticChatConfig): void {
  syntheticChatControl.current = config;
}
