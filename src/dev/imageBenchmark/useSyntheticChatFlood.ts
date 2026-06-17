// DEV-ONLY: replays an offline fixture of cinna-style IRC messages
// (ircFixtureMessages) through the real `onMessage(channel, tags, text)` handler
// — the same path twitch-chat-service uses — so chat performance can be
// stress-tested with repeatable high-burst traffic without depending on the
// channel actually being live. The Chat Perf screen mounts Chat in
// `syntheticTransport` mode so this flood is the *only* message source.
//
// The replay is deterministic by construction: the fixture is emitted in order
// at the preset's rate. 7TV emotes render by name-matching the channel's loaded
// emote set — point this at a channel whose set is loaded (e.g. cinna).
import { useDevToolsAccess } from '@app/utils/devTools/devToolsGate';
import { useEffect } from 'react';
import {
  IRC_FIXTURE_MESSAGES,
  buildIrcFixtureMessage,
  type BuiltFixtureMessage,
} from './ircFixtureMessages';
import { syntheticChatControl } from './syntheticChatControl';

type OnMessage = (
  channel: string,
  tags: Record<string, string>,
  text: string,
) => void;

// Replay state is module-level so the suite can reset both renderers to the same
// fixture position for a fair A/B (resetFloodReplay), and so the emit counter
// keeps producing unique message ids across the whole session.
let replayCursor = 0;
let emitSeq = 0;

// The expanded {tags,text} pool is built once per room id (the fixture is
// otherwise channel-independent) so emitting only costs a spread + two field
// writes, not a tag-object rebuild.
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

// Restart the replay from the top of the fixture. Called between A/B phases so
// nitro and expo process a byte-identical stream.
export function resetFloodReplay(): void {
  replayCursor = 0;
}

export function useSyntheticChatFlood({
  channelName,
  channelId,
  onMessage,
}: {
  channelName: string;
  channelId: string;
  onMessage: OnMessage;
}): void {
  // Gated exactly like the dev menu: dev/internal/e2e builds, or an admin login
  // on testflight/production (useDevToolsAccess). The flood only ever *emits*
  // when a dev-tools screen flips syntheticChatControl.active, which is itself
  // behind the same gate — so for a real user this stays inert and never arms
  // the interval. Lets the synthetic raid run on a real device build (incl.
  // TestFlight as an admin), not just __DEV__ Metro.
  const devToolsAccess = useDevToolsAccess();
  useEffect(() => {
    if (devToolsAccess !== 'enabled') {
      return;
    }
    const TICK_MS = 100;
    let carryover = 0;
    let lastBurst = performance.now();
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

    // Real IRC delivers a raid's messages spread across event-loop ticks, never
    // as one synchronous burst. Cap emissions per tick and carry the rest over
    // so a burst surges instead of blocking the JS thread. (Dispatching each
    // message via its own staggered setTimeout to mimic per-frame WS delivery
    // was tried and measured *worse* — 180 timer fires/s is harness overhead the
    // real transport doesn't pay — and the raid jank was unchanged either way,
    // confirming the jank is GPU emote-upload, not delivery timing.)
    const MAX_EMIT_PER_TICK = 18;

    const interval = setInterval(() => {
      const cfg = syntheticChatControl.current;
      if (!cfg.active) {
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
  }, [channelName, channelId, onMessage, devToolsAccess]);
}
