import { StyleSheet, Text, View } from 'react-native';

import type { LiveStats } from './use-chat-perf-suite';
import { useCpuUsage } from './use-cpu-usage';
import { useUiThreadFrameHealth } from './use-ui-thread-frame-health';
import { useUsedMemoryMb } from './use-used-memory';

function fpsColor(fps: number) {
  if (fps >= 55) {
    return '#3ddc84';
  }

  if (fps >= 30) {
    return '#ffcc00';
  }

  return '#ff5252';
}

function cpuColor(cpu: number) {
  if (cpu > 80) {
    return '#ff5252';
  }

  if (cpu > 50) {
    return '#ffcc00';
  }

  return '#3ddc84';
}

function memColor(memMb: number) {
  if (memMb > 1500) {
    return '#ff5252';
  }

  if (memMb > 900) {
    return '#ffcc00';
  }

  return '#8ab4ff';
}

export function LiveChatPerfOverlay({
  live,
  renderer,
}: {
  live: LiveStats;
  renderer: string;
}) {
  const ui = useUiThreadFrameHealth();
  const memMb = useUsedMemoryMb();
  const cpu = useCpuUsage();

  return (
    <View style={styles.bar}>
      <Stat label='fps' value={String(live.fps)} color={fpsColor(live.fps)} />
      <Stat
        label='jank/s'
        value={String(live.jank)}
        color={live.jank > 3 ? '#ff5252' : '#aaa'}
      />
      <Stat label='ui-fps' value={String(ui.fps)} color={fpsColor(ui.fps)} />
      <Stat
        label='ui-jank'
        value={String(ui.jank)}
        color={ui.jank > 3 ? '#ff5252' : '#3ddc84'}
      />
      <Stat label='cpu' value={`${cpu}%`} color={cpuColor(cpu)} />
      <Stat
        label='mem'
        value={memMb >= 1024 ? `${(memMb / 1024).toFixed(1)}G` : `${memMb}MB`}
        color={memColor(memMb)}
      />
      <Stat label='lib' value={renderer} color='#fff' />
    </View>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stat: { alignItems: 'center', minWidth: 38 },
  value: { fontSize: 14, fontFamily: 'Menlo', fontWeight: '700' },
  label: { fontSize: 8, color: '#777', fontFamily: 'Menlo' },
});
