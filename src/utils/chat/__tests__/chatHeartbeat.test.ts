import { getHeartbeatAction } from '../chatHeartbeat';

const INTERVAL = 30_000;

describe('getHeartbeatAction', () => {
  test('waits while the socket is not open', () => {
    expect(
      getHeartbeatAction({
        isOpen: false,
        awaitingPong: true,
        msSinceLastActivity: 999_999,
        intervalMs: INTERVAL,
      }),
    ).toBe('wait');
  });

  test('waits while the channel has recent inbound traffic', () => {
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: false,
        msSinceLastActivity: INTERVAL - 1,
        intervalMs: INTERVAL,
      }),
    ).toBe('wait');
  });

  test('probes once the open socket has gone quiet for a full interval', () => {
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: false,
        msSinceLastActivity: INTERVAL,
        intervalMs: INTERVAL,
      }),
    ).toBe('probe');
  });

  test('reconnects when a prior probe is still unanswered', () => {
    expect(
      getHeartbeatAction({
        isOpen: true,
        awaitingPong: true,
        msSinceLastActivity: INTERVAL * 2,
        intervalMs: INTERVAL,
      }),
    ).toBe('reconnect');
  });
});
