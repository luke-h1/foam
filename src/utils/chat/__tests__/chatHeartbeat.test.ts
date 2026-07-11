import { getHeartbeatAction } from '../chatHeartbeat';

const INTERVAL = 30_000;
const PROBE_DEADLINE = 5_000;

describe('getHeartbeatAction', () => {
  test('waits while the socket is not open', () => {
    expect(
      getHeartbeatAction({
        isOpen: false,
        awaitingPong: true,
        msSinceProbeSent: 999_999,
        msSinceLastActivity: 999_999,
        intervalMs: INTERVAL,
        probeDeadlineMs: PROBE_DEADLINE,
      }),
    ).toBe('wait');
  });

  test('waits while the channel has recent inbound traffic', () => {
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: false,
        msSinceProbeSent: null,
        msSinceLastActivity: INTERVAL - 1,
        intervalMs: INTERVAL,
        probeDeadlineMs: PROBE_DEADLINE,
      }),
    ).toBe('wait');
  });

  test('probes once the open socket has gone quiet for a full interval', () => {
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: false,
        msSinceProbeSent: null,
        msSinceLastActivity: INTERVAL,
        intervalMs: INTERVAL,
        probeDeadlineMs: PROBE_DEADLINE,
      }),
    ).toBe('probe');
  });

  test('reconnects when the outstanding probe is unanswered past its deadline', () => {
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: true,
        msSinceProbeSent: INTERVAL,
        msSinceLastActivity: INTERVAL * 2,
        intervalMs: INTERVAL,
        probeDeadlineMs: PROBE_DEADLINE,
      }),
    ).toBe('reconnect');
  });

  test('waits for a fresh probe instead of tearing down a healthy socket', () => {
    // Resume sequence: the foreground liveness check sends a PING, then the
    // heartbeat tick that was suspended in background flushes milliseconds
    // later. The probe is fresh, so the tick must not reconnect.
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: true,
        msSinceProbeSent: 20,
        msSinceLastActivity: INTERVAL * 2,
        intervalMs: INTERVAL,
        probeDeadlineMs: PROBE_DEADLINE,
      }),
    ).toBe('wait');
  });

  test('waits while awaiting a pong with no recorded probe age', () => {
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: true,
        msSinceProbeSent: null,
        msSinceLastActivity: INTERVAL * 2,
        intervalMs: INTERVAL,
        probeDeadlineMs: PROBE_DEADLINE,
      }),
    ).toBe('wait');
  });
});
