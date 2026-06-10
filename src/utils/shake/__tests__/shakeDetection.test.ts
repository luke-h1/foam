import { createShakeDetector } from '../shakeDetection';

const REST = { x: 0, y: 0, z: 1 };
const SPIKE = { x: 2, y: 1.5, z: 1 };

describe('createShakeDetector', () => {
  test('ignores a device at rest', () => {
    const detect = createShakeDetector();

    expect(detect(REST, 0)).toEqual(false);
    expect(detect(REST, 100)).toEqual(false);
    expect(detect(REST, 200)).toEqual(false);
  });

  test('ignores a single bump', () => {
    const detect = createShakeDetector();

    expect(detect(SPIKE, 0)).toEqual(false);
    expect(detect(REST, 100)).toEqual(false);
  });

  test('detects repeated spikes inside the window', () => {
    const detect = createShakeDetector();

    expect(detect(SPIKE, 0)).toEqual(false);
    expect(detect(SPIKE, 200)).toEqual(false);
    expect(detect(SPIKE, 400)).toEqual(true);
  });

  test('does not count spikes spread beyond the window', () => {
    const detect = createShakeDetector({ windowMs: 1200 });

    expect(detect(SPIKE, 0)).toEqual(false);
    expect(detect(SPIKE, 1000)).toEqual(false);
    expect(detect(SPIKE, 2400)).toEqual(false);
  });

  test('resets after reporting a shake', () => {
    const detect = createShakeDetector();

    detect(SPIKE, 0);
    detect(SPIKE, 100);
    expect(detect(SPIKE, 200)).toEqual(true);
    expect(detect(SPIKE, 300)).toEqual(false);
  });
});
