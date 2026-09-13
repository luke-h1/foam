import { createChatDelayRamp } from '../chatDelayRamp';

describe('createChatDelayRamp', () => {
  test('applies the first target at once', () => {
    const ramp = createChatDelayRamp(0.5, 0);

    expect(ramp.resolve(3_000, 10_000)).toBe(3_000);
  });

  test('ramps an increase at the configured rate until it reaches the target', () => {
    const ramp = createChatDelayRamp(0.5, 0);
    ramp.resolve(0, 10_000);

    expect(ramp.resolve(6_000, 10_000)).toBe(0);
    expect(ramp.resolve(6_000, 11_000)).toBe(500);
    expect(ramp.resolve(6_000, 13_000)).toBe(1_500);
    expect(ramp.resolve(6_000, 30_000)).toBe(6_000);
    expect(ramp.resolve(6_000, 31_000)).toBe(6_000);
  });

  test('applies a decrease at once', () => {
    const ramp = createChatDelayRamp(0.5, 0);
    ramp.resolve(6_000, 10_000);

    expect(ramp.resolve(2_000, 10_100)).toBe(2_000);
    expect(ramp.resolve(0, 10_200)).toBe(0);
  });

  test('ignores target changes inside the deadband, except turning the delay off', () => {
    const ramp = createChatDelayRamp(0.5, 2_000);
    ramp.resolve(6_000, 10_000);

    expect(ramp.resolve(5_400, 10_100)).toBe(6_000);
    expect(ramp.resolve(7_500, 10_200)).toBe(6_000);
    expect(ramp.resolve(0, 10_300)).toBe(0);
  });

  test('a target inside the deadband does not stop a ramp short', () => {
    const ramp = createChatDelayRamp(0.5, 2_000);
    ramp.resolve(0, 10_000);
    ramp.resolve(6_000, 10_000);

    expect(ramp.resolve(6_500, 20_000)).toBe(5_000);
    expect(ramp.resolve(6_500, 30_000)).toBe(6_000);
  });

  test('reset makes the next target apply at once again', () => {
    const ramp = createChatDelayRamp(0.5, 0);
    ramp.resolve(0, 10_000);
    ramp.reset();

    expect(ramp.resolve(6_000, 10_100)).toBe(6_000);
  });
});
