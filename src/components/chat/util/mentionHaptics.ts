import { impact } from '@app/lib/haptics';

const MENTION_HAPTIC_MIN_INTERVAL_MS = 2500;

let lastMentionHapticAt = 0;

export function triggerMentionHaptic(now: number = Date.now()): void {
  if (now - lastMentionHapticAt < MENTION_HAPTIC_MIN_INTERVAL_MS) {
    return;
  }

  lastMentionHapticAt = now;
  impact('medium');
}
