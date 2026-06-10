import { impact } from '@app/lib/haptics';

// One buzz per burst: busy chats can mention a streamer several times per
// second and per-message feedback would be constant vibration.
const MENTION_HAPTIC_MIN_INTERVAL_MS = 2500;

let lastMentionHapticAt = 0;

export function triggerMentionHaptic(now: number = Date.now()): void {
  if (now - lastMentionHapticAt < MENTION_HAPTIC_MIN_INTERVAL_MS) {
    return;
  }

  lastMentionHapticAt = now;
  void impact('medium');
}

export function resetMentionHapticThrottleForTesting(): void {
  lastMentionHapticAt = 0;
}
