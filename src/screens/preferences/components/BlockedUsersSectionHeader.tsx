import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

interface BlockedUsersSectionHeaderProps {
  count?: number;
}

export function BlockedUsersSectionHeader({
  count,
}: BlockedUsersSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text type='caption' weight='semibold' style={styles.sectionTitle}>
        Blocked Accounts
      </Text>
      {count !== undefined ? (
        <Text
          type='caption'
          color='gray.textLow'
          style={styles.sectionCountText}
        >
          {count}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCountText: {
    paddingHorizontal: theme.space16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.space8,
  },
  sectionTitle: {
    color: theme.color.textSecondary.dark,
    paddingHorizontal: theme.space16,
  },
});
