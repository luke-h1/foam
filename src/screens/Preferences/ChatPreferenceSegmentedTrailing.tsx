import { theme } from '@app/styles/themes';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { StyleSheet } from 'react-native';

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
  onChange,
  onValueChange,
  values,
  variant = 'settings',
}: {
  selectedIndex: number;
  onChange: (event: { nativeEvent: { selectedSegmentIndex: number } }) => void;
  onValueChange: (value: string) => void;
  values: readonly string[];
  variant?: 'ios' | 'settings';
}) {
  return (
    <SegmentedControl
      appearance='dark'
      onChange={onChange}
      onValueChange={onValueChange}
      selectedIndex={selectedIndex}
      style={
        variant === 'ios' ? styles.iosSegmentedControl : styles.segmentedControl
      }
      tintColor={theme.colorPrimary}
      values={[...values]}
    />
  );
}
