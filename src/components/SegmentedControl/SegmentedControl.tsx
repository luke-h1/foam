import { selection } from '@app/lib/haptics';
import {
  SegmentedControl as ExpoSegmentedControl,
  type NativeSegmentedControlChangeEvent,
} from '@expo/ui/community/segmented-control';
import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

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
  const values = useMemo(() => items.map(item => item.label), [items]);

  const handleChange = useCallback(
    (event: NativeSegmentedControlChangeEvent) => {
      onChange(event.nativeEvent.selectedSegmentIndex);
      void selection();
    },
    [onChange],
  );

  return (
    <ExpoSegmentedControl
      appearance='dark'
      onChange={handleChange}
      selectedIndex={currentIndex}
      style={styles.container}
      tintColor={theme.colorDarkGreen}
      values={values}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: theme.colorBorderSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    borderRadius: 999,
    width: '100%',
  },
});
