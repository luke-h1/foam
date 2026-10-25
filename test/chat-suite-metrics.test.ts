import {
  averageRam,
  isLeakSlope,
  meanCpu,
  meanFps,
} from '../scripts/bench/chat-suite-report';

describe('chat-suite-report metrics', () => {
  test('flags a steep RSS climb', () => {
    // 20 samples × 500ms = 10s. +19 MB ≈ 114 MB/min.
    const measures = Array.from({ length: 20 }, (_, index) => ({
      cpu: { perName: { 'JS Thread': 40 } },
      fps: 58,
      ram: 400 + index,
    }));

    const drift = averageRam(measures);

    expect(drift).toEqual({
      startMb: 400,
      endMb: 419,
      peakMb: 419,
      deltaMb: 19,
      slopeMbPerMin: 114,
      samples: 20,
    });

    expect(isLeakSlope(drift!)).toEqual(true);
  });

  test('treats flat RSS as healthy', () => {
    const measures = [
      { cpu: { perName: { 'JS Thread': 20 } }, fps: 60, ram: 500 },
      { cpu: { perName: { 'JS Thread': 22 } }, fps: 59, ram: 501 },
      { cpu: { perName: { 'JS Thread': 21 } }, fps: 60, ram: 500 },
    ];

    expect(isLeakSlope(averageRam(measures)!)).toEqual(false);
  });

  test('averages fps and cpu', () => {
    const measures = [
      { cpu: { perName: { a: 10, b: 30 } }, fps: 60, ram: 1 },
      { cpu: { perName: { a: 20, b: 40 } }, fps: 40, ram: 1 },
    ];

    expect(meanFps(measures)).toEqual(50);

    // Sum of threads per sample, then mean across samples (a+b = 40, 60 → 50).
    expect(meanCpu(measures)).toEqual(50);
  });
});
