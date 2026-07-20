import { StyleSheet } from 'react-native';

import { SegmentedControl } from '@expo/ui/community/segmented-control';

const styles = StyleSheet.create({
  segmentedControl: {
    minWidth: 200,
  },
  iosSegmentedControl: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});

export function ChatPreferenceSegmentedTrailing({
  selectedIndex,
  onSelectIndex,
  values,
  variant = 'settings',
}: {
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  values: readonly string[];
  variant?: 'ios' | 'settings';
}) {
  return (
    <SegmentedControl
      appearance='dark'
      onChange={event => onSelectIndex(event.nativeEvent.selectedSegmentIndex)}
      selectedIndex={selectedIndex}
      style={
        variant === 'ios' ? styles.iosSegmentedControl : styles.segmentedControl
      }
      values={[...values]}
    />
  );
}
