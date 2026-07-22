import { StyleSheet, Text, View } from 'react-native';

import type { LiveStats } from './useChatPerfSuite';
import { useCpuUsage } from './useCpuUsage';
import { useUiThreadFrameHealth } from './useUiThreadFrameHealth';
import { useUsedMemoryMb } from './useUsedMemory';

const fpsColor = (fps: number) =>
  fps >= 55 ? '#3ddc84' : fps >= 30 ? '#ffcc00' : '#ff5252';

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
      <Stat
        label='cpu'
        value={`${cpu}%`}
        color={cpu > 80 ? '#ff5252' : cpu > 50 ? '#ffcc00' : '#3ddc84'}
      />
      <Stat
        label='mem'
        value={memMb >= 1024 ? `${(memMb / 1024).toFixed(1)}G` : `${memMb}MB`}
        color={memMb > 1500 ? '#ff5252' : memMb > 900 ? '#ffcc00' : '#8ab4ff'}
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
