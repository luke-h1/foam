import { getReconnectDelay } from '../attachListener';
import { FAST_FIRST_RECONNECT_INTERVAL_MS } from '../constants';

describe('getReconnectDelay', () => {
  const baseInterval = 2000;

  test('reconnects near-instantly on the first attempt regardless of base interval', () => {
    expect(getReconnectDelay(0, baseInterval)).toEqual(
      FAST_FIRST_RECONNECT_INTERVAL_MS,
    );
    expect(getReconnectDelay(0, 5000)).toEqual(
      FAST_FIRST_RECONNECT_INTERVAL_MS,
    );
  });

  test('falls back to the base interval on the second attempt', () => {
    expect(getReconnectDelay(1, baseInterval)).toEqual(2000);
  });

  test('ramps exponentially after the second attempt', () => {
    expect(getReconnectDelay(2, baseInterval)).toEqual(3000);
    expect(getReconnectDelay(3, baseInterval)).toEqual(4500);
    expect(getReconnectDelay(4, baseInterval)).toEqual(6750);
  });

  test('caps the backoff at eight times the base interval', () => {
    expect(getReconnectDelay(20, baseInterval)).toEqual(baseInterval * 8);
    expect(getReconnectDelay(100, baseInterval)).toEqual(baseInterval * 8);
  });
});
