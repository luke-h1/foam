export interface AccelerometerSample {
  x: number;
  y: number;
  z: number;
}

export type ShakeDetector = (
  sample: AccelerometerSample,
  timestampMs: number,
) => boolean;

const magnitudeThreshold = 2.2;
const minSpikes = 3;
const windowMs = 1200;

export function createShakeDetector(): ShakeDetector {
  let spikeTimestamps: number[] = [];

  return (sample, timestampMs) => {
    const magnitude = Math.sqrt(
      sample.x * sample.x + sample.y * sample.y + sample.z * sample.z,
    );

    if (magnitude < magnitudeThreshold) {
      return false;
    }

    spikeTimestamps = spikeTimestamps.filter(
      spikeAt => timestampMs - spikeAt <= windowMs,
    );
    spikeTimestamps.push(timestampMs);

    if (spikeTimestamps.length >= minSpikes) {
      spikeTimestamps = [];
      return true;
    }

    return false;
  };
}
