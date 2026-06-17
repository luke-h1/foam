import { useEffect, useRef, useState } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat } from '@app/components/Chat/Chat';
import { LiveChatPerfOverlay } from '@app/dev/imageBenchmark/LiveChatPerfOverlay';
import { useChatPerfSuite } from '@app/dev/imageBenchmark/useChatPerfSuite';
import { SUITE_TOTAL_MS } from '@app/dev/imageBenchmark/chatPerfSuite';
import {
  syntheticChatControl,
  SYNTHETIC_PRESETS,
} from '@app/dev/imageBenchmark/syntheticChatControl';
import { resetFloodReplay } from '@app/dev/imageBenchmark/useSyntheticChatFlood';

// cinna — heavy 7TV channel (942 emotes, 65% animated AVIF). Mounting the real
// Chat here loads her actual emote/badge sets, so this is as real-world as the
// live stream's chat; the synthetic flood just adds repeatable burst load.
const CINNA = { channelId: '204730616', channelName: 'cinna' };

export default function ChatPerfScreen() {
  // Keep the screen awake for the length of a suite run so the device never
  // dims/locks mid-benchmark and skews the frame/CPU numbers.
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { flood: floodParam, suite: suiteParam } = useLocalSearchParams<{
    flood?: string;
    suite?: string;
  }>();
  const [flood, setFlood] = useState(
    floodParam && SYNTHETIC_PRESETS[floodParam] ? floodParam : 'off',
  );
  const { live, suite, runSuite, stopSuite } = useChatPerfSuite();
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
      syntheticChatControl.current = SYNTHETIC_PRESETS[floodParam]!;
    }
    return () => {
      syntheticChatControl.current = SYNTHETIC_PRESETS.off!;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPreset = (key: string) => {
    // Restart the fixture from the top so each manual run is the same replay.
    resetFloodReplay();
    syntheticChatControl.current = SYNTHETIC_PRESETS[key]!;
    setFlood(key);
  };

  const totalSecs = Math.round(SUITE_TOTAL_MS / 1000);
  const progress = suite.running ? 1 - suite.totalSecondsLeft / totalSecs : 0;

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
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <View style={styles.countdownRow}>
            <Text
              style={[
                styles.countdown,
                suite.measuring && styles.countdownMeasuring,
              ]}
            >
              {suite.phaseSecondsLeft}s
            </Text>
            <Text style={styles.countdownSub}>
              {suite.measuring ? 'measuring' : 'warming up'} · total{' '}
              {suite.totalSecondsLeft}s left
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.controls}>
          <Pressable
            style={styles.runBtn}
            onPress={runSuite}
            testID='suite-run'
          >
            <Text style={styles.runText}>▶ Run Full Suite · {totalSecs}s</Text>
          </Pressable>
          <View style={styles.group}>
            {Object.keys(SYNTHETIC_PRESETS).map(key => (
              <Pressable
                key={key}
                style={[styles.chip, flood === key && styles.chipFlood]}
                onPress={() => setPreset(key)}
                testID={`perf-flood-${key}`}
              >
                <Text style={styles.chipText}>{key}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {suite.results.length > 0 ? (
        <View style={styles.results}>
          {/* ui-fps/ui-jank = real UI-thread rendering (the metric that answers
              the goal); js-fps is JS-thread headroom (inflated jank, secondary). */}
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

function ResultRow({ cells, header }: { cells: string[]; header?: boolean }) {
  return (
    <View style={styles.resRow}>
      {cells.map((c, i) => (
        <Text
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={[
            styles.resCell,
            i === 0 && styles.resCellFirst,
            header && styles.resHeader,
          ]}
        >
          {c}
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
  results: { paddingHorizontal: 10, paddingVertical: 4 },
  resRow: { flexDirection: 'row', paddingVertical: 2 },
  resCell: {
    flex: 1,
    color: '#ccc',
    fontSize: 11,
    fontFamily: 'Menlo',
    textAlign: 'right',
  },
  resCellFirst: { flex: 1.6, textAlign: 'left' },
  resHeader: { color: '#fff', fontWeight: '700' },
  chat: { flex: 1, marginTop: 4 },
});
