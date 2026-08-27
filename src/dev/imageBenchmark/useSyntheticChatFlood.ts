import { useEffect } from 'react';

import { useDevToolsAccess } from '@app/utils/devTools/devToolsGate';

import {
  buildIrcFixtureMessage,
  type BuiltFixtureMessage,
  IRC_FIXTURE_MESSAGES,
} from './ircFixtureMessages';
import { syntheticChatControl } from './syntheticChatControl';

type OnMessage = (
  channel: string,
  tags: Record<string, string>,
  text: string,
) => void;

let replayCursor = 0;
let emitSeq = 0;
/**
 * Bumped on reset so the running interval drops carryover/lastBurst and restarts its cadence.
 */
let replayEpoch = 0;

/**
 * Pool built once per room id so emitting costs a spread + two field writes, not a tag-object rebuild.
 */
let builtPool: BuiltFixtureMessage[] | null = null;
let builtPoolRoomId: string | null = null;

function getFixturePool(roomId: string): BuiltFixtureMessage[] {
  if (!builtPool || builtPoolRoomId !== roomId) {
    builtPool = IRC_FIXTURE_MESSAGES.map(entry =>
      buildIrcFixtureMessage(entry, roomId),
    );
    builtPoolRoomId = roomId;
  }
  return builtPool;
}

export function resetFloodReplay(): void {
  replayCursor = 0;
  replayEpoch += 1;
}

export function useSyntheticChatFlood({
  channelName,
  channelId,
  onMessage,
  enabled,
}: {
  channelName: string;
  channelId: string;
  onMessage: OnMessage;
  enabled: boolean;
}): void {
  const devToolsAccess = useDevToolsAccess();
  useEffect(() => {
    if (!enabled || devToolsAccess !== 'enabled') {
      return;
    }
    const TICK_MS = 100;
    let carryover = 0;
    let lastBurst = performance.now();
    let seenReplayEpoch = replayEpoch;
    const pool = getFixturePool(channelId);

    const emitOne = () => {
      const entry = pool[replayCursor % pool.length]!;
      replayCursor += 1;
      emitSeq += 1;
      onMessage(
        channelName,
        {
          ...entry.tags,
          id: `synthetic-${emitSeq}`,
          'tmi-sent-ts': String(Date.now()),
        },
        entry.text,
      );
    };

    /**
     * Cap per tick and carry over so a burst surges instead of blocking the JS thread. Per-message setTimeout measured worse (180 timer fires/s) with unchanged jank.
     */
    const MAX_EMIT_PER_TICK = 18;

    const interval = setInterval(() => {
      const cfg = syntheticChatControl.current;
      if (seenReplayEpoch !== replayEpoch) {
        seenReplayEpoch = replayEpoch;
        carryover = 0;
        lastBurst = performance.now();
      }
      if (!cfg.active) {
        carryover = 0;
        return;
      }
      carryover += (cfg.msgPerSec * TICK_MS) / 1000;

      const now = performance.now();
      if (cfg.burstEveryMs > 0 && now - lastBurst >= cfg.burstEveryMs) {
        lastBurst = now;
        carryover += cfg.burstSize;
      }

      const count = Math.min(Math.floor(carryover), MAX_EMIT_PER_TICK);
      carryover -= count;

      for (let i = 0; i < count; i += 1) {
        emitOne();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [channelName, channelId, onMessage, devToolsAccess, enabled]);
}
