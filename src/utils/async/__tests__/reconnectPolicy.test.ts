import {
  getReconnectBackoffMs,
  getReconnectDelay,
  IRC_RECONNECT_POLICY,
} from '../reconnectPolicy';

describe('getReconnectBackoffMs', () => {
  const baseInterval = 2000;

  test('reconnects near-instantly on the first attempt regardless of base interval', () => {
    expect(getReconnectBackoffMs(0, baseInterval)).toEqual(300);

    expect(getReconnectBackoffMs(0, 5000)).toEqual(300);
  });

  test('falls back to the base interval on the second attempt', () => {
    expect(getReconnectBackoffMs(1, baseInterval)).toEqual(2000);
  });

  test('ramps exponentially after the second attempt', () => {
    expect(getReconnectBackoffMs(2, baseInterval)).toEqual(3000);

    expect(getReconnectBackoffMs(3, baseInterval)).toEqual(4500);

    expect(getReconnectBackoffMs(4, baseInterval)).toEqual(6750);
  });

  test('caps the backoff at eight times the base interval', () => {
    expect(getReconnectBackoffMs(20, baseInterval)).toEqual(16_000);

    expect(getReconnectBackoffMs(100, baseInterval)).toEqual(16_000);
  });
});

describe('getReconnectDelay', () => {
  test('adds up to the policy jitter on top of the backoff', () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(getReconnectDelay(1, IRC_RECONNECT_POLICY)).toEqual(2125);

    random.mockRestore();
  });
});
