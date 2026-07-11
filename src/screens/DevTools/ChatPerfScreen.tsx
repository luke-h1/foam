import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
} from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams } from 'expo-router';

import { Chat } from '@app/components/Chat/Chat';
import {
  type ChatHotspotResult,
  runChatHotspotBenchmarks,
} from '@app/dev/chatHotspotBench/scenarios';
import { SUITE_TOTAL_MS } from '@app/dev/imageBenchmark/chatPerfSuite';
import { LiveChatPerfOverlay } from '@app/dev/imageBenchmark/LiveChatPerfOverlay';
import {
  setSyntheticChatControl,
  SYNTHETIC_PRESETS,
} from '@app/dev/imageBenchmark/syntheticChatControl';
import { useChatPerfSuite } from '@app/dev/imageBenchmark/useChatPerfSuite';
import { resetFloodReplay } from '@app/dev/imageBenchmark/useSyntheticChatFlood';

const CINNA = { channelId: '204730616', channelName: 'cinna' };

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function CountdownSeconds({
  ms,
  suffix,
  style,
}: {
  ms: SharedValue<number>;
  suffix: string;
  style: StyleProp<TextStyle>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const secs = Math.max(0, Math.ceil(ms.value / 1000));
    return { text: `${secs}${suffix}` } as unknown as TextInputProps;
  });
  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      defaultValue={`0${suffix}`}
      editable={false}
      pointerEvents='none'
      style={[styles.countdownInput, style]}
      underlineColorAndroid='transparent'
    />
  );
}

export function ChatPerfScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { flood: floodParam, suite: suiteParam } = useLocalSearchParams<{
    flood?: string;
    suite?: string;
  }>();
  const [flood, setFlood] = useState(
    floodParam && SYNTHETIC_PRESETS[floodParam] ? floodParam : 'off',
  );
  const {
    live,
    suite,
    runSuite,
    stopSuite,
    phaseCountdownMs,
    totalCountdownMs,
  } = useChatPerfSuite();
  const [hotspotBusy, setHotspotBusy] = useState(false);
  const [hotspotStatus, setHotspotStatus] = useState('idle');
  const [hotspotResults, setHotspotResults] = useState<ChatHotspotResult[]>([]);
  const progressStyle = useAnimatedStyle(() => {
    const pct = Math.max(
      0,
      Math.min(100, (1 - totalCountdownMs.value / SUITE_TOTAL_MS) * 100),
    );
    return { width: `${pct}%` };
  });
  const autoStarted = useRef(false);

  useEffect(() => {
    if (suiteParam && !autoStarted.current) {
      autoStarted.current = true;
      // Give the chat a moment to mount/connect before the first phase.
      const t = setTimeout(() => void runSuite(), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [suiteParam, runSuite]);

  useEffect(() => {
    if (floodParam && SYNTHETIC_PRESETS[floodParam]) {
      resetFloodReplay();
      setSyntheticChatControl(SYNTHETIC_PRESETS[floodParam]!);
    }
    return () => {
      setSyntheticChatControl(SYNTHETIC_PRESETS.off!);
    };
  }, [floodParam]);

  const setPreset = (key: string) => {
    // Restart the fixture from the top so each manual run is the same replay.
    resetFloodReplay();
    setSyntheticChatControl(SYNTHETIC_PRESETS[key]!);
    setFlood(key);
  };

  const runHotspots = async () => {
    if (hotspotBusy || suite.running) {
      return;
    }
    setHotspotBusy(true);
    setHotspotResults([]);
    setHotspotStatus('preparing…');
    // Pause any live flood so ingest/clearMessages measurements stay clean.
    setSyntheticChatControl(SYNTHETIC_PRESETS.off!);
    resetFloodReplay();
    setFlood('off');
    try {
      const results = await runChatHotspotBenchmarks({
        onProgress: name => setHotspotStatus(name),
      });
      setHotspotResults(results);
      setHotspotStatus('done');
    } catch (error) {
      setHotspotStatus(`error: ${String(error)}`);
    }
    setHotspotBusy(false);
  };

  const totalSecs = Math.round(SUITE_TOTAL_MS / 1000);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 44 }]}>
      <LiveChatPerfOverlay live={live} renderer='expo-image' />

      {suite.running ? (
        <View style={styles.suiteCard}>
          <View style={styles.suiteHeader}>
            <Text style={styles.suiteTitle}>
              {suite.phaseLabel} · {suite.phaseSub}
            </Text>
            <Pressable
              style={styles.stopBtn}
              onPress={stopSuite}
              testID='suite-stop'
            >
              <Text style={styles.chipText}>Stop</Text>
            </Pressable>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <View style={styles.countdownRow}>
            <CountdownSeconds
              ms={phaseCountdownMs}
              suffix='s'
              style={[
                styles.countdown,
                suite.measuring && styles.countdownMeasuring,
              ]}
            />
            <View style={styles.countdownSubRow}>
              <Text style={styles.countdownSub}>
                {suite.measuring ? 'measuring' : 'warming up'} · total{' '}
              </Text>
              <CountdownSeconds
                ms={totalCountdownMs}
                suffix='s left'
                style={styles.countdownSub}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.controls}>
          <Pressable
            style={styles.runBtn}
            onPress={runSuite}
            testID='suite-run'
            disabled={hotspotBusy}
          >
            <Text style={styles.runText}>▶ Run Full Suite · {totalSecs}s</Text>
          </Pressable>
          <Pressable
            style={[styles.hotspotBtn, hotspotBusy && styles.btnOff]}
            onPress={() => void runHotspots()}
            testID='hotspot-run'
            disabled={hotspotBusy}
          >
            <Text style={styles.runText}>
              {hotspotBusy
                ? `⏱ ${hotspotStatus}`
                : '⏱ Run hotspot microbenches'}
            </Text>
          </Pressable>
          <View style={styles.group}>
            {Object.keys(SYNTHETIC_PRESETS).map(key => (
              <Pressable
                key={key}
                style={[styles.chip, flood === key && styles.chipFlood]}
                onPress={() => setPreset(key)}
                testID={`perf-flood-${key}`}
                disabled={hotspotBusy}
              >
                <Text style={styles.chipText}>{key}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {suite.results.length > 0 ? (
        <View style={styles.results}>
          <ResultRow
            header
            cells={['phase', 'ui-fps', 'ui-jank', 'js-fps', 'drop%']}
          />
          {suite.results.map(r => (
            <ResultRow
              key={r.preset}
              cells={[
                r.preset,
                String(r.uiFpsAvg),
                String(r.uiJankPerSec),
                String(r.fpsAvg),
                String(r.droppedPct),
              ]}
            />
          ))}
        </View>
      ) : null}

      {hotspotResults.length > 0 ? (
        <View style={styles.results}>
          <Text style={styles.hotspotHeading}>Hotspots (ms · mean/med)</Text>
          <HotspotResultRow
            header
            cells={['scenario', 'mean', 'med', 'min', 'max']}
          />
          {hotspotResults.map(result => (
            <HotspotResultRow
              key={result.id}
              cells={[
                result.name,
                String(result.meanMs),
                String(result.medianMs),
                String(result.minMs),
                String(result.maxMs),
              ]}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.chat}>
        <Chat
          channelId={CINNA.channelId}
          channelName={CINNA.channelName}
          applyTopInset={false}
          syntheticTransport
        />
      </View>
    </View>
  );
}

const RESULT_COLUMNS = ['phase', 'ui-fps', 'ui-jank', 'js-fps', 'drop%'];
const HOTSPOT_COLUMNS = ['scenario', 'mean', 'med', 'min', 'max'];

function ResultRow({ cells, header }: { cells: string[]; header?: boolean }) {
  return (
    <View style={styles.resRow}>
      {RESULT_COLUMNS.map((col, i) => (
        <Text
          key={col}
          style={[
            styles.resCell,
            i === 0 && styles.resCellFirst,
            header && styles.resHeader,
          ]}
        >
          {cells[i]}
        </Text>
      ))}
    </View>
  );
}

function HotspotResultRow({
  cells,
  header,
}: {
  cells: string[];
  header?: boolean;
}) {
  return (
    <View style={styles.resRow}>
      {HOTSPOT_COLUMNS.map((col, i) => (
        <Text
          key={col}
          style={[
            styles.resCell,
            i === 0 && styles.hotspotCellFirst,
            header && styles.resHeader,
          ]}
        >
          {cells[i]}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  controls: { paddingHorizontal: 8, paddingTop: 8, gap: 8 },
  group: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  runBtn: {
    backgroundColor: '#06c',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  hotspotBtn: {
    backgroundColor: '#355',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnOff: { opacity: 0.5 },
  runText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
  chip: {
    backgroundColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  chipFlood: { backgroundColor: '#a33' },
  chipText: { color: '#fff', fontSize: 12, fontFamily: 'Menlo' },
  suiteCard: {
    margin: 8,
    padding: 12,
    backgroundColor: '#111',
    borderRadius: 10,
    gap: 8,
  },
  suiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suiteTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Menlo',
    fontWeight: '700',
  },
  stopBtn: {
    backgroundColor: '#a33',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: '#3ddc84' },
  countdownRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  countdown: {
    color: '#ffcc00',
    fontSize: 30,
    fontWeight: '800',
    fontFamily: 'Menlo',
  },
  countdownMeasuring: { color: '#3ddc84' },
  countdownSub: { color: '#888', fontSize: 11, fontFamily: 'Menlo' },
  countdownSubRow: { flexDirection: 'row', alignItems: 'baseline' },
  countdownInput: { padding: 0 },
  results: { paddingHorizontal: 10, paddingVertical: 4 },
  hotspotHeading: {
    color: '#9cf',
    fontSize: 11,
    fontFamily: 'Menlo',
    fontWeight: '700',
    marginBottom: 2,
  },
  resRow: { flexDirection: 'row', paddingVertical: 2 },
  resCell: {
    flex: 1,
    color: '#ccc',
    fontSize: 11,
    fontFamily: 'Menlo',
    textAlign: 'right',
  },
  resCellFirst: { flex: 1.6, textAlign: 'left' },
  hotspotCellFirst: { flex: 2.4, textAlign: 'left' },
  resHeader: { color: '#fff', fontWeight: '700' },
  chat: { flex: 1, marginTop: 4 },
});
