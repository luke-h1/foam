import { StyleSheet, useColorScheme } from 'react-native';

import {
  type NativeSegmentedControlChangeEvent,
  SegmentedControl as ExpoSegmentedControl,
} from '@expo/ui/community/segmented-control';

import { selection } from '@app/lib/haptics';
import { theme } from '@app/styles/themes';

type SegmentedControlItem = {
  label: string;
};

type SegmentedControlProps = {
  items: SegmentedControlItem[];
  currentIndex: number;
  onChange: (index: number) => void;
};

export function SegmentedControl({
  items,
  currentIndex,
  onChange,
}: SegmentedControlProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const values = items.map(item => item.label);

  const handleChange = (event: NativeSegmentedControlChangeEvent) => {
    onChange(event.nativeEvent.selectedSegmentIndex);
    void selection();
  };

  return (
    <ExpoSegmentedControl
      appearance={scheme}
      onChange={handleChange}
      selectedIndex={currentIndex}
      style={styles.container}
      tintColor={theme.color.accent[scheme]}
      values={values}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
});
