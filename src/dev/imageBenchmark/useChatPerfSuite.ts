import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { beginSignpost, endSignpost, markSignpost } from '@app/lib/signpost';
import { chatStore$ } from '@app/store/chat/observables/chatStore';

import {
  COOLDOWN_MS,
  type PhaseResult,
  SUITE_PHASES,
  SUITE_TOTAL_MS,
  WARMUP_MS,
} from './chatPerfSuite';
import {
  SYNTHETIC_PRESETS,
  syntheticChatControl,
} from './syntheticChatControl';
import { resetFloodReplay } from './useSyntheticChatFlood';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const mean = (a: number[]) =>
  a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const pct = (a: number[], q: number) => {
  if (a.length === 0) {
    return 0;
  }
  // eslint-disable-next-line react-doctor/js-tosorted-immutable -- Hermes lacks toSorted
  const s = [...a].sort((x, y) => x - y);
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
  measuring: boolean;
  results: PhaseResult[];
}

interface FrameAccumulator {
  on: boolean;
  fps: number[];
  jank: number;
  frames: number;
}

const IDLE: SuiteState = {
  running: false,
  phaseIndex: -1,
  phaseLabel: '',
  phaseSub: '',
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
  const accum = useRef<FrameAccumulator>({
    on: false,
    fps: [],
    jank: 0,
    frames: 0,
  });
  const cancelRef = useRef(false);
  const runningRef = useRef(false);

  /**
   * UI-thread accumulators; uiActive gates them to measure windows and JS reads the totals at phase end.
   */
  const uiFrames = useSharedValue(0);
  const uiJank = useSharedValue(0);
  const uiActive = useSharedValue(false);

  /**
   * Countdown ticks on the UI thread so it survives a JS thread saturated by the flood.
   */
  const phaseCountdownMs = useSharedValue(0);
  const totalCountdownMs = useSharedValue(0);
  const countdownTicking = useSharedValue(false);

  useFrameCallback(frame => {
    'worklet';
    if (countdownTicking.value && frame.timeSincePreviousFrame !== null) {
      const dt = frame.timeSincePreviousFrame;
      if (phaseCountdownMs.value > 0) {
        phaseCountdownMs.value = Math.max(0, phaseCountdownMs.value - dt);
      }
      if (totalCountdownMs.value > 0) {
        totalCountdownMs.value = Math.max(0, totalCountdownMs.value - dt);
      }
    }
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
      const signpostName = `chat-perf.${label}.${sub}`;
      beginSignpost(signpostName);

      const runPhaseWindow = async () => {
        const start = performance.now();
        if (measuring) {
          accum.current = { on: true, fps: [], jank: 0, frames: 0 };
          uiFrames.set(0);
          uiJank.set(0);
          uiActive.set(true);
        }
        phaseCountdownMs.set(ms);
        totalCountdownMs.set(Math.max(0, suiteEnd - start));
        setSuite(s => ({
          ...s,
          phaseIndex,
          phaseLabel: label,
          phaseSub: sub,
          measuring,
        }));
        while (performance.now() - start < ms) {
          if (cancelRef.current) {
            break;
          }
          await sleep(120);
        }
        accum.current.on = false;
        uiActive.set(false);
      };

      await runPhaseWindow().finally(() => {
        endSignpost(signpostName);
      });
    },
    [phaseCountdownMs, totalCountdownMs, uiActive, uiFrames, uiJank],
  );

  const runSuite = useCallback(async () => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    cancelRef.current = false;
    countdownTicking.set(true);
    const results: PhaseResult[] = [];

    setSuite({ ...IDLE, running: true });
    markSignpost('chat-perf.suite-start');
    const suiteEnd = performance.now() + SUITE_TOTAL_MS;

    const runPhases = async () => {
      for (let i = 0; i < SUITE_PHASES.length; i += 1) {
        if (cancelRef.current) {
          break;
        }
        const phase = SUITE_PHASES[i]!;
        const label = phase.preset;

        // Restart the fixture replay at measure start so each run processes a byte-identical stream.
        syntheticChatControl.current = SYNTHETIC_PRESETS[phase.preset]!;

        // eslint-disable-next-line react-doctor/async-await-in-loop, react-doctor/async-defer-await -- ordered phases; the window is the work
        await runWindow(i, label, 'warming up', WARMUP_MS, false, suiteEnd);
        if (cancelRef.current) {
          break;
        }

        resetFloodReplay();
        // eslint-disable-next-line react-doctor/async-defer-await -- window must finish before the cancel check
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
          uiFpsAvg: Math.round(uiFrames.get() / uiSecs),
          uiJankPerSec: Math.round((uiJank.get() / uiSecs) * 10) / 10,
        });
        setSuite(s => ({ ...s, results: [...results] }));

        // Cooldown: stop the flood so memory/GC settles before the next phase.
        syntheticChatControl.current = SYNTHETIC_PRESETS.off!;
        if (i < SUITE_PHASES.length - 1) {
          // eslint-disable-next-line react-doctor/async-defer-await -- window must finish before the cancel check
          await runWindow(i, label, 'cooldown', COOLDOWN_MS, false, suiteEnd);
          if (cancelRef.current) {
            break;
          }
        }
      }
    };

    await runPhases().finally(() => {
      syntheticChatControl.current = SYNTHETIC_PRESETS.off!;
      resetFloodReplay();
      countdownTicking.set(false);
      setSuite(s => ({ ...IDLE, results: s.results }));
      runningRef.current = false;
    });
  }, [runWindow, uiFrames, uiJank, countdownTicking]);

  // runSuite's finally owns the transition to IDLE - otherwise the Run button reappears mid-cancel and a re-tap starts a second overlapping run.
  const stopSuite = useCallback(() => {
    cancelRef.current = true;
    syntheticChatControl.current = SYNTHETIC_PRESETS.off!;
    resetFloodReplay();
    setSuite(s => (s.running ? { ...s, phaseSub: 'stopping…' } : s));
  }, []);

  return {
    live,
    suite,
    runSuite,
    stopSuite,
    phaseCountdownMs,
    totalCountdownMs,
  };
}
