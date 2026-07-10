export type HeartbeatAction = 'reconnect' | 'probe' | 'wait';

/**
 * Decide what the chat heartbeat tick should do. React Native's WebSocket has
 * no ping frames, so a half-open socket (Wi-Fi↔cellular handoff, NAT timeout,
 * OS suspend) can sit in OPEN forever with no close event. Each tick:
 *
 * - `wait` when the socket isn't open, or it has had inbound traffic within the
 *   last interval (a busy channel proves its own liveness — no probe needed).
 * - `probe` when the socket has gone quiet: send a PING and start awaiting a
 *   PONG.
 * - `reconnect` when a probe from the previous tick is still unanswered: no
 *   inbound line arrived, so the socket is dead and must be torn down.
 */
export function getHeartbeatAction({
  isOpen,
  awaitingPong,
  msSinceLastActivity,
  intervalMs,
}: {
  isOpen: boolean;
  awaitingPong: boolean;
  msSinceLastActivity: number;
  intervalMs: number;
}): HeartbeatAction {
  if (!isOpen) {
    return 'wait';
  }
  if (awaitingPong) {
    return 'reconnect';
  }
  if (msSinceLastActivity < intervalMs) {
    return 'wait';
  }
  return 'probe';
}
