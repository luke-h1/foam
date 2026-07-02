// DEV-ONLY: measures frame health on the UI THREAD via Reanimated's
// useFrameCallback, as opposed to the JS-thread requestAnimationFrame sampler in
// useChatPerfSuite. This distinction matters under a synthetic raid: the JS-rAF
// probe shares the JS thread with the flood timer, message processing and (in
// dev) the Metro HMR socket, so it reports "jank" whenever those delay a JS
// frame — even when the UI thread is actually presenting at a steady 60fps and
// the user sees no stutter. useFrameCallback ticks on the UI thread (where rows
// are actually rasterised), so its jank count reflects real, visible dropped
// frames. Compare the two: a gap (JS jank ≫ UI jank) means the JS-rAF number is
// a measurement artifact, not pipeline jank.
import { useState } from 'react';
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

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
      runOnJS(setHealth)({ fps, jank: jankCount });
      frames.value = 0;
      jank.value = 0;
      windowStart.value = frame.timestamp;
    }
  });

  return health;
}
