export type HeartbeatAction = 'reconnect' | 'probe' | 'wait';

export function getHeartbeatAction({
  isOpen,
  awaitingPong,
  msSinceProbeSent,
  msSinceLastActivity,
  intervalMs,
  probeDeadlineMs,
}: {
  isOpen: boolean;
  awaitingPong: boolean;
  /**
   * Milliseconds since the outstanding probe's PING was sent; `null` when no
   * probe is outstanding.
   */
  msSinceProbeSent: number | null;
  msSinceLastActivity: number;
  intervalMs: number;
  probeDeadlineMs: number;
}): HeartbeatAction {
  if (!isOpen) {
    return 'wait';
  }
  if (awaitingPong) {
    return msSinceProbeSent !== null && msSinceProbeSent >= probeDeadlineMs
      ? 'reconnect'
      : 'wait';
  }
  if (msSinceLastActivity < intervalMs) {
    return 'wait';
  }
  return 'probe';
}
