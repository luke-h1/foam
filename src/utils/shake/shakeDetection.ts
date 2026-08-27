export interface AccelerometerSample {
  x: number;
  y: number;
  z: number;
}

export interface ShakeDetectorOptions {
  /**
   * Total acceleration (in g, gravity included) that counts as a spike.
   */
  magnitudeThreshold?: number;
  /**
   * Spikes required inside the window to register a shake.
   */
  minSpikes?: number;
  windowMs?: number;
}

export type ShakeDetector = (
  sample: AccelerometerSample,
  timestampMs: number,
) => boolean;

/**
 * Stateful spike counter over accelerometer samples: a deliberate shake
 * produces repeated spikes well above 2g, a single bump does not.
 */
export function createShakeDetector({
  magnitudeThreshold = 2.2,
  minSpikes = 3,
  windowMs = 1200,
}: ShakeDetectorOptions = {}): ShakeDetector {
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
