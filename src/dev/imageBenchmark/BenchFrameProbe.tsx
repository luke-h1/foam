// DEV-ONLY: JS-thread frame health while chat is on screen. 1s fps windows held in memory (per-frame IO would bias the metric), flushed to img-bench.json every 10s and on unmount.
import { useEffect } from 'react';

import { appendFrames } from './benchResults';

interface FrameSample {
  t: number;
  fps: number;
}

export function BenchFrameProbe() {
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();
    const samples: FrameSample[] = [];
    let lastFlush = windowStart;

    const flush = () => {
      if (samples.length === 0) {
        return;
      }
      appendFrames({ samples: samples.splice(0, samples.length) });
    };

    const loop = (now: number) => {
      frames += 1;
      const elapsed = now - windowStart;
      if (elapsed >= 1000) {
        samples.push({
          t: Date.now(),
          fps: Math.round((frames * 1000) / elapsed),
        });
        frames = 0;
        windowStart = now;
        if (now - lastFlush >= 10000) {
          lastFlush = now;
          flush();
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      flush();
    };
  }, []);

  return null;
}
