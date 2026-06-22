import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocalSearchParams } from 'expo-router';

import {
  appendRun,
  markPhase,
  type PassResult,
  readResults,
  resetResults,
} from '@app/dev/imageBenchmark/benchResults';
import { CINNA_EMOTE_URLS } from '@app/dev/imageBenchmark/cinnaEmoteWorkload';
import {
  clearRetained,
  prewarm,
  resetMemoryCache,
  runConcurrent,
  runSequential,
} from '@app/dev/imageBenchmark/runDecodeBenchmark';
import {
  setSyntheticChatControl,
  SYNTHETIC_PRESETS,
  syntheticChatControl,
} from '@app/dev/imageBenchmark/syntheticChatControl';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DECODE_COLUMNS = ['scenario', 'mean', 'p50', 'p95', 'total'];

function Row({ cells, header }: { cells: string[]; header?: boolean }) {
  return (
    <View style={[styles.row, header && styles.headerRow]}>
      {DECODE_COLUMNS.map((col, i) => (
        <Text
          key={col}
          style={[
            styles.cell,
            i === 0 && styles.cellFirst,
            header && styles.cellHeader,
          ]}
        >
          {cells[i]}
        </Text>
      ))}
    </View>
  );
}

function decodeRow(
  runs: PassResult[],
  label: string,
  pass: PassResult['pass'],
  mode: PassResult['mode'],
) {
  const r = runs.find(x => x.pass === pass && x.mode === mode);
  if (!r) {
    return [label, '—', '—', '—', '—'];
  }
  return [
    label,
    String(r.meanMs),
    String(r.p50Ms),
    String(r.p95Ms),
    String(r.totalMs),
  ];
}

export default function ImageBenchmarkScreen() {
  const { auto } = useLocalSearchParams<{ auto?: string }>();
  const [status, setStatus] = useState('idle');
  const [runs, setRuns] = useState<PassResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [flood, setFlood] = useState('off');
  const autoStarted = useRef(false);
  const insets = useSafeAreaInsets();

  const runPasses = async () => {
    await resetMemoryCache();
    clearRetained();
    markPhase('cold-start');
    setStatus(`cold decode (${CINNA_EMOTE_URLS.length})`);
    const cold = await runSequential('cold', CINNA_EMOTE_URLS, done =>
      setStatus(`cold ${done}/${CINNA_EMOTE_URLS.length}`),
    );
    appendRun(cold);
    markPhase('cold-end');
    setRuns(readResults().runs);
    await sleep(2000);

    clearRetained();
    markPhase('warm-start');
    setStatus('warm decode');
    const warm = await runSequential('warm', CINNA_EMOTE_URLS);
    appendRun(warm);
    setRuns(readResults().runs);

    clearRetained();
    setStatus('concurrent burst');
    const conc = await runConcurrent(CINNA_EMOTE_URLS, 16);
    appendRun(conc);
    markPhase('done');
    setRuns(readResults().runs);
    clearRetained();
    await sleep(1000);
  };

  const runAll = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    resetResults();
    clearRetained();
    setRuns([]);
    try {
      setStatus('prewarming: downloading all emotes to disk…');
      await prewarm(CINNA_EMOTE_URLS);
      await runPasses();
      setStatus('ALL DONE');
    } catch (error) {
      setStatus(`error: ${String(error)}`);
    }
    setBusy(false);
    setRuns(readResults().runs);
  };

  useEffect(() => {
    // Auto-start runs once on mount (guarded by autoStarted); runAll closes over
    // benchmark state we deliberately don't want to re-trigger the suite.
    if (auto && !autoStarted.current) {
      autoStarted.current = true;
      void runAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
  }, [auto]);

  const setFloodPreset = (key: string) => {
    setSyntheticChatControl(SYNTHETIC_PRESETS[key]!);
    setFlood(key);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 52, paddingBottom: insets.bottom + 48 },
      ]}
    >
      <Text style={styles.h1}>expo-image decode benchmark</Text>
      <Text style={styles.status} testID='bench-status'>
        {status}
      </Text>

      <View style={styles.btnRow}>
        <Pressable
          style={[styles.btn, busy && styles.btnOff]}
          onPress={runAll}
          testID='bench-run-all'
          disabled={busy}
        >
          <Text style={styles.btnText}>{busy ? 'running…' : 'Run decode'}</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={() => {
            resetResults();
            setRuns([]);
            setStatus('reset');
          }}
          testID='bench-reset'
        >
          <Text style={styles.btnText}>Reset</Text>
        </Pressable>
      </View>

      <Text style={styles.h2}>Decode latency — cinna 942 × 2x AVIF (ms)</Text>
      <Row header cells={['scenario', 'mean', 'p50', 'p95', 'total']} />
      <Row cells={decodeRow(runs, 'cold seq', 'cold', 'sequential')} />
      <Row cells={decodeRow(runs, 'warm seq', 'warm', 'sequential')} />
      <Row cells={decodeRow(runs, 'warm concurrent', 'warm', 'concurrent')} />

      <Text style={styles.h2}>Synthetic chat flood (stress test)</Text>
      <Text style={styles.note}>
        Set a preset, then open a channel chat whose 7TV set is loaded (e.g.
        cinna). Floods the real pipeline with emote-heavy bursts.
      </Text>
      <View style={styles.btnRow}>
        {Object.keys(SYNTHETIC_PRESETS).map(key => (
          <Pressable
            key={key}
            style={[styles.btnSm, flood === key && styles.btnActive]}
            onPress={() => setFloodPreset(key)}
            testID={`flood-${key}`}
          >
            <Text style={styles.btnText}>{key}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.note}>
        active: {flood} ·{' '}
        {syntheticChatControl.current.active
          ? `${syntheticChatControl.current.msgPerSec}/s + bursts of ${syntheticChatControl.current.burstSize}`
          : 'off'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 16, gap: 8, paddingBottom: 48 },
  h1: { color: '#fff', fontSize: 18, fontWeight: '700' },
  h2: { color: '#8ab4ff', fontSize: 14, fontWeight: '600', marginTop: 16 },
  status: { color: '#0f0', fontSize: 13, fontFamily: 'Menlo' },
  note: { color: '#888', fontSize: 11 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  btn: {
    backgroundColor: '#243',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  btnSm: {
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnOff: { backgroundColor: '#333' },
  btnActive: { backgroundColor: '#06c' },
  btnText: { color: '#fff', fontSize: 13 },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  headerRow: { borderBottomColor: '#444' },
  cell: {
    flex: 1,
    color: '#ccc',
    fontSize: 11,
    fontFamily: 'Menlo',
    textAlign: 'right',
  },
  cellFirst: { flex: 1.6, textAlign: 'left' },
  cellHeader: { color: '#fff', fontWeight: '700' },
});
