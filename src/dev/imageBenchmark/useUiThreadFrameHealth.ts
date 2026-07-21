import { useState } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface UiFrameHealth {
  fps: number;
  jank: number;
}

// A 60hz frame is ~16.7ms; a missed vsync presents as ~33ms. >25ms means at
// least one frame was genuinely dropped on the UI thread.
const DROPPED_FRAME_MS = 25;

export function useUiThreadFrameHealth(): UiFrameHealth {
  const [health, setHealth] = useState<UiFrameHealth>({ fps: 0, jank: 0 });
  const frames = useSharedValue(0);
  const jank = useSharedValue(0);
  const windowStart = useSharedValue(0);

  useFrameCallback(frame => {
    'worklet';
    if (windowStart.value === 0) {
      windowStart.value = frame.timestamp;
      return;
    }
    frames.value += 1;
    if (
      frame.timeSincePreviousFrame !== null &&
      frame.timeSincePreviousFrame > DROPPED_FRAME_MS
    ) {
      jank.value += 1;
    }
    const elapsed = frame.timestamp - windowStart.value;
    if (elapsed >= 1000) {
      const fps = Math.round((frames.value * 1000) / elapsed);
      const jankCount = jank.value;
      scheduleOnRN(setHealth, { fps, jank: jankCount });
      frames.value = 0;
      jank.value = 0;
      windowStart.value = frame.timestamp;
    }
  });

  return health;
}
