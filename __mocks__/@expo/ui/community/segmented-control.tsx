// eslint-disable-next-line no-restricted-imports
import { Text, TouchableOpacity, View } from 'react-native';

import type { SegmentedControlProps } from '@expo/ui/community/segmented-control';

/**
 * The real control is a SwiftUI/Compose host view, so it can't mount under
 * jsdom. Each value renders as a pressable so tests can drive `onChange` /
 * `onValueChange` the same way a tap on the native control would.
 */
export function SegmentedControl({
  values = [],
  selectedIndex,
  onChange,
  onValueChange,
  testID,
  style,
}: SegmentedControlProps) {
  return (
    <View testID={testID ?? 'segmented-control'} style={style}>
      {values.map((value, index) => (
        <TouchableOpacity
          key={value}
          testID={`segmented-control-option-${value}`}
          accessibilityState={{ selected: index === selectedIndex }}
          onPress={() => {
            onValueChange?.(value);
            onChange?.({ nativeEvent: { selectedSegmentIndex: index, value } });
          }}
        >
          <Text>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
