// DEV-ONLY: runs the deterministic Chat Perf suite entirely on-device. Owns a
// single rAF sampler (live FPS/jank/throughput) and a phase state machine that
// drives renderer + seeded flood, exposing a live countdown and final results.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import {
  COOLDOWN_MS,
  SUITE_PHASES,
  SUITE_TOTAL_MS,
  WARMUP_MS,
  type PhaseResult,
} from './chatPerfSuite';
import { resetFloodReplay } from './useSyntheticChatFlood';
import {
  syntheticChatControl,
  SYNTHETIC_PRESETS,
} from './syntheticChatControl';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const mean = (a: number[]) =>
  a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const pct = (a: number[], q: number) => {
  if (a.length === 0) {
    return 0;
  }
  const s = a.toSorted((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
};

export interface LiveStats {
  fps: number;
  jank: number;
  msgPerSec: number;
  total: number;
}

export interface SuiteState {
  running: boolean;
  phaseIndex: number;
  phaseLabel: string;
  phaseSub: string;
  phaseSecondsLeft: number;
  totalSecondsLeft: number;
  measuring: boolean;
  results: PhaseResult[];
}

const IDLE: SuiteState = {
  running: false,
  phaseIndex: -1,
  phaseLabel: '',
  phaseSub: '',
  phaseSecondsLeft: 0,
  totalSecondsLeft: 0,
  measuring: false,
  results: [],
};

export function useChatPerfSuite() {
  const [live, setLive] = useState<LiveStats>({
    fps: 0,
    jank: 0,
    msgPerSec: 0,
    total: 0,
  });
  const [suite, setSuite] = useState<SuiteState>(IDLE);
  const accum = useRef({ on: false, fps: [] as number[], jank: 0, frames: 0 });
  const cancelRef = useRef(false);

  // UI-thread frame accumulators (the real rendering smoothness). Reanimated
  // ticks this worklet on the UI thread; we gate accumulation to measure windows
  // via uiActive and read the totals back on JS when each phase ends.
  const uiFrames = useSharedValue(0);
  const uiJank = useSharedValue(0);
  const uiActive = useSharedValue(false);

  useFrameCallback(frame => {
    'worklet';
    if (!uiActive.value) {
      return;
    }
    uiFrames.value += 1;
    if (
      frame.timeSincePreviousFrame !== null &&
      frame.timeSincePreviousFrame > 25
    ) {
      uiJank.value += 1;
    }
  });

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let jank = 0;
    let windowStart = performance.now();
    let last = windowStart;
    let lastMsg = chatStore$.messages.peek().length;

    const loop = (now: number) => {
      frames += 1;
      if (now - last > 33) {
        jank += 1;
      }
      last = now;
      if (now - windowStart >= 1000) {
        const fps = Math.round((frames * 1000) / (now - windowStart));
        const total = chatStore$.messages.peek().length;
        const msgPerSec = Math.max(0, total - lastMsg);
        lastMsg = total;
        setLive({ fps, jank, msgPerSec, total });
        if (accum.current.on) {
          accum.current.fps.push(fps);
          accum.current.jank += jank;
          accum.current.frames += frames;
        }
        frames = 0;
        jank = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const runWindow = useCallback(
    async (
      phaseIndex: number,
      label: string,
      sub: string,
      ms: number,
      measuring: boolean,
      suiteEnd: number,
    ) => {
      const start = performance.now();
      if (measuring) {
        accum.current = { on: true, fps: [], jank: 0, frames: 0 };
        uiFrames.value = 0;
        uiJank.value = 0;
        uiActive.value = true;
      }
      while (performance.now() - start < ms) {
        if (cancelRef.current) {
          break;
        }
        const phaseLeft = Math.ceil((ms - (performance.now() - start)) / 1000);
        const totalLeft = Math.max(
          0,
          Math.ceil((suiteEnd - performance.now()) / 1000),
        );
        setSuite(s => ({
          ...s,
          phaseIndex,
          phaseLabel: label,
          phaseSub: sub,
          phaseSecondsLeft: phaseLeft,
          totalSecondsLeft: totalLeft,
          measuring,
        }));
        await sleep(200);
      }
      accum.current.on = false;
      uiActive.value = false;
    },
    [uiActive, uiFrames, uiJank],
  );

  const runSuite = useCallback(async () => {
    cancelRef.current = false;
    const results: PhaseResult[] = [];

    setSuite({ ...IDLE, running: true });
    const suiteEnd = performance.now() + SUITE_TOTAL_MS;

    for (let i = 0; i < SUITE_PHASES.length; i += 1) {
      if (cancelRef.current) {
        break;
      }
      const phase = SUITE_PHASES[i]!;
      const label = phase.preset;

      // Start the flood for warmup ramp; restart the fixture replay at measure
      // start so each run processes a byte-identical stream (repeatable).
      syntheticChatControl.current = SYNTHETIC_PRESETS[phase.preset]!;
      // eslint-disable-next-line react-doctor/async-await-in-loop, react-doctor/async-defer-await -- phases are ordered and the window must run to completion (it IS the work); cancellation is checked after
      await runWindow(i, label, 'warming up', WARMUP_MS, false, suiteEnd);
      if (cancelRef.current) {
        break;
      }

      resetFloodReplay();
      // eslint-disable-next-line react-doctor/async-defer-await -- the measure window must run fully before we can check whether it was cancelled
      await runWindow(i, label, 'measuring', phase.measureMs, true, suiteEnd);
      if (cancelRef.current) {
        break;
      }

      const fps = accum.current.fps;
      const secs = Math.max(1, fps.length);
      const uiSecs = Math.max(1, phase.measureMs / 1000);
      results.push({
        preset: phase.preset,
        fpsAvg: Math.round(mean(fps)),
        fpsMin: fps.length ? Math.min(...fps) : 0,
        fpsP10: Math.round(pct(fps, 0.1)),
        jankPerSec: Math.round((accum.current.jank / secs) * 10) / 10,
        droppedPct: Math.max(
          0,
          Math.round(100 * (1 - accum.current.frames / (secs * 60))),
        ),
        messages: chatStore$.messages.peek().length,
        uiFpsAvg: Math.round(uiFrames.value / uiSecs),
        uiJankPerSec: Math.round((uiJank.value / uiSecs) * 10) / 10,
      });
      setSuite(s => ({ ...s, results: [...results] }));

      // Cooldown: stop the flood so memory/GC settles before the next phase.
      syntheticChatControl.current = SYNTHETIC_PRESETS.off!;
      if (i < SUITE_PHASES.length - 1) {
        // eslint-disable-next-line react-doctor/async-defer-await -- the cooldown window must run fully before we can check whether it was cancelled
        await runWindow(i, label, 'cooldown', COOLDOWN_MS, false, suiteEnd);
        if (cancelRef.current) {
          break;
        }
      }
    }

    syntheticChatControl.current = SYNTHETIC_PRESETS.off!;
    resetFloodReplay();
    setSuite(s => ({ ...IDLE, results: s.results }));
  }, [runWindow, uiFrames, uiJank]);

  const stopSuite = useCallback(() => {
    cancelRef.current = true;
    syntheticChatControl.current = SYNTHETIC_PRESETS.off!;
    resetFloodReplay();
    setSuite(s => ({ ...IDLE, results: s.results }));
  }, []);

  return { live, suite, runSuite, stopSuite };
}
