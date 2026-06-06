import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

export const TOP_TAB_ROUTES = [
  { key: 'streams', title: 'Streams' },
  { key: 'categories', title: 'Categories' },
] as const;

type TopSegmentControlProps = {
  index: number;
  onIndexChange: (index: number) => void;
};

export function TopSegmentControl({
  index,
  onIndexChange,
}: TopSegmentControlProps) {
  return (
    <View style={styles.segmentFrame}>
      <SegmentedControl
        currentIndex={index}
        items={TOP_TAB_ROUTES.map(route => ({ label: route.title }))}
        onChange={onIndexChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  segmentFrame: {
    paddingBottom: theme.space8,
    paddingTop: theme.space12,
  },
});
