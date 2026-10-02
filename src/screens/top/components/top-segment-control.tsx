import { StyleSheet, View } from 'react-native';

import { SegmentedControl } from '@app/components/segmented-control/segmented-control';
import { TOP_TAB_ROUTES } from '@app/constants/top-tab-routes';

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

/**
 * The segment is the Top tab's navigation bar title, so it keeps a fixed
 * width that leaves room for the bar button beside it.
 */
const styles = StyleSheet.create({
  segmentFrame: {
    height: 36,
    justifyContent: 'center',
    width: 232,
  },
});
