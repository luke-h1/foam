import { StyleSheet, useColorScheme, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export interface MetadataRow {
  label: string;
  value?: string | null;
}

export function EmotePreviewMetadata({ rows }: { rows: MetadataRow[] }) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (rows.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.metadataCard,
        { backgroundColor: theme.color.surfaceAlpha[scheme] },
      ]}
    >
      {rows.map(row => (
        <View key={row.label} style={styles.metadataRow}>
          <Text
            style={[
              styles.metadataLabel,
              { color: theme.color.textSecondary[scheme] },
            ]}
            weight='semibold'
          >
            {row.label}
          </Text>
          <Text
            style={[styles.metadataValue, { color: theme.color.text[scheme] }]}
            numberOfLines={2}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  metadataCard: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    padding: theme.space12,
  },
  metadataLabel: {
    fontSize: theme.fontSize11,
    minWidth: 68,
    textTransform: 'uppercase',
  },
  metadataRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    paddingVertical: theme.space8,
  },
  metadataValue: {
    flex: 1,
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.2,
  },
});
