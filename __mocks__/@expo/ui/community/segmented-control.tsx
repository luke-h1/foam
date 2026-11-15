import { Text, TouchableOpacity, View } from 'react-native';

import type { SegmentedControlProps } from '@expo/ui/community/segmented-control';

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
