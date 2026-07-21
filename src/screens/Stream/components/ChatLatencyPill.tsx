import { StyleSheet, View } from 'react-native';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useVideoLatencyDisplay } from '@app/store/stream/react/selectors';
import { theme } from '@app/styles/themes';

export function ChatLatencyPill() {
  const latencySeconds = useVideoLatencyDisplay();
  const label = latencySeconds == null ? '—' : `${latencySeconds.toFixed(1)}s`;

  return (
    <View style={styles.row} pointerEvents='none'>
      <View style={styles.pill}>
        <SymbolView
          name='clock'
          size={11}
          tintColor={theme.color.textSecondary.dark}
          style={styles.icon}
        />
        <Text style={styles.value}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: theme.color.overlay.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space4,
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space4,
  },
  icon: {
    opacity: 0.8,
  },
  value: {
    color: theme.colorWhite,
    fontSize: theme.fontSize11,
    fontWeight: '600',
    opacity: 0.82,
  },
});
