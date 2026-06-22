import { StyleSheet,View } from 'react-native';

import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { TOP_TAB_ROUTES } from '@app/constants/topTabRoutes';
import { theme } from '@app/styles/themes';

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
    alignSelf: 'stretch',
    paddingBottom: theme.space8,
    paddingTop: theme.space12,
  },
});
