import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { LegendList } from '@legendapp/list';
import { StyleSheet, View } from 'react-native';

const SEARCH_QUICK_ACTIONS = [
  {
    title: 'Just Chatting',
    subtitle: 'Jump into the busiest live conversations',
    query: 'just chatting',
  },
  {
    title: 'Valorant',
    subtitle: 'Check competitive streams and ranked grinders',
    query: 'valorant',
  },
  {
    title: 'League',
    subtitle: 'See top solo queue and pro-watch channels',
    query: 'league of legends',
  },
] as const;

type QuickAction = (typeof SEARCH_QUICK_ACTIONS)[number];

function SearchQuickActionCard({
  item,
  onPress,
}: {
  item: QuickAction;
  onPress: (query: string) => void;
}) {
  return (
    <Button style={styles.quickActionCard} onPress={() => onPress(item.query)}>
      <Text type='sm' weight='semibold' style={styles.quickActionTitle}>
        {item.title}
      </Text>
      <Text type='xs' color='gray.textLow' style={styles.quickActionSubtitle}>
        {item.subtitle}
      </Text>
    </Button>
  );
}

function renderSearchQuickActionItem({
  item,
  extraData,
}: {
  item: QuickAction;
  extraData?: { onPress: (query: string) => void };
}) {
  return (
    <SearchQuickActionCard
      item={item}
      onPress={extraData?.onPress ?? (() => undefined)}
    />
  );
}

export function SearchQuickActionsRail({
  onQuickActionPress,
}: {
  onQuickActionPress: (query: string) => void;
}) {
  return (
    <View style={styles.quickActionsSection}>
      <View style={styles.sectionHeader}>
        <Text
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          START WITH
        </Text>
        <Text type='2xl' weight='bold' style={styles.sectionHeadline}>
          Quick routes
        </Text>
      </View>
      <LegendList
        horizontal
        data={SEARCH_QUICK_ACTIONS}
        estimatedItemSize={168}
        keyExtractor={item => item.query}
        extraData={{ onPress: onQuickActionPress }}
        renderItem={renderSearchQuickActionItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionsRail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  quickActionCard: {
    marginRight: 12,
    maxWidth: 220,
    minWidth: 168,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickActionSubtitle: {
    marginTop: 4,
  },
  quickActionTitle: {
    lineHeight: 18,
  },
  quickActionsRail: {
    paddingRight: 16,
  },
  quickActionsSection: {
    gap: 12,
    marginTop: 8,
  },
  sectionHeadline: {
    marginTop: 4,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
