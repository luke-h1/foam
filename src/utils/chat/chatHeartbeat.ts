export type HeartbeatAction = 'reconnect' | 'probe' | 'wait';

/**
 * Decide what the chat heartbeat tick should do. React Native's WebSocket has
 * no ping frames, so a half-open socket (Wi-Fi↔cellular handoff, NAT timeout,
 * OS suspend) can sit in OPEN forever with no close event. Each tick:
 *
 * - `wait` when the socket isn't open, when it has had inbound traffic within
 *   the last interval (a busy channel proves its own liveness — no probe
 *   needed), or when a probe is outstanding but still within its answer
 *   deadline.
 * - `probe` when the socket has gone quiet: send a PING and start awaiting a
 *   PONG.
 * - `reconnect` when an outstanding probe has gone unanswered past
 *   `probeDeadlineMs`: no inbound line arrived, so the socket is dead and must
 *   be torn down.
 *
 * The deadline check matters because the heartbeat is not the only probe
 * sender: the foreground-resume liveness check sends PINGs through the same
 * awaiting-PONG flag. A suspended heartbeat tick that flushes right after the
 * app resumes must not treat a milliseconds-old resume probe as if it had been
 * pending for a whole interval.
 */
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
