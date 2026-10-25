import { createChatDelayRamp } from '../chatDelayRamp';

describe('createChatDelayRamp', () => {
  test('applies the first target at once', () => {
    const ramp = createChatDelayRamp(0.5, 0);

    expect(ramp.resolve(3000, 10_000)).toBe(3000);
  });

  test('ramps an increase at the configured rate until it reaches the target', () => {
    const ramp = createChatDelayRamp(0.5, 0);
    ramp.resolve(0, 10_000);

    expect(ramp.resolve(6000, 10_000)).toBe(0);

    expect(ramp.resolve(6000, 11_000)).toBe(500);

    expect(ramp.resolve(6000, 13_000)).toBe(1500);

    expect(ramp.resolve(6000, 30_000)).toBe(6000);

    expect(ramp.resolve(6000, 31_000)).toBe(6000);
  });

  test('applies a decrease at once', () => {
    const ramp = createChatDelayRamp(0.5, 0);
    ramp.resolve(6000, 10_000);

    expect(ramp.resolve(2000, 10_100)).toBe(2000);

    expect(ramp.resolve(0, 10_200)).toBe(0);
  });

  test('ignores target changes inside the deadband, except turning the delay off', () => {
    const ramp = createChatDelayRamp(0.5, 2000);
    ramp.resolve(6000, 10_000);

    expect(ramp.resolve(5400, 10_100)).toBe(6000);

    expect(ramp.resolve(7500, 10_200)).toBe(6000);

    expect(ramp.resolve(0, 10_300)).toBe(0);
  });

  test('a target inside the deadband does not stop a ramp short', () => {
    const ramp = createChatDelayRamp(0.5, 2000);
    ramp.resolve(0, 10_000);
    ramp.resolve(6000, 10_000);

    expect(ramp.resolve(6500, 20_000)).toBe(5000);

    expect(ramp.resolve(6500, 30_000)).toBe(6000);
  });

  test('reset makes the next target apply at once again', () => {
    const ramp = createChatDelayRamp(0.5, 0);
    ramp.resolve(0, 10_000);
    ramp.reset();

    expect(ramp.resolve(6000, 10_100)).toBe(6000);
  });
});
