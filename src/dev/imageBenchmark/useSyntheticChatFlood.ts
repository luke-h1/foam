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
 * Bumped on every reset so the running interval can drop its accumulated
 * carryover/lastBurst state and restart emission cadence from a clean slate.
 */
let replayEpoch = 0;

/**
 * The expanded {tags,text} pool is built once per room id (the fixture is
 * otherwise channel-independent) so emitting only costs a spread + two field
 * writes, not a tag-object rebuild.
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
     * Cap emissions per tick and carry the rest over so a burst surges instead
     * of blocking the JS thread. Staggered per-message setTimeout was measured
     * worse (180 timer fires/s is pure harness overhead) with unchanged jank.
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
