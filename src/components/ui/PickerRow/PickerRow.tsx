import { StyleSheet, View } from 'react-native';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { theme } from '@app/styles/themes';

import { Text } from '../Text/Text';
import { PickerRowProps } from './PickerRow.types';

export function PickerRow<T extends string>({
  label,
  options,
  selection,
  onSelectionChange,
}: PickerRowProps<T>) {
  return (
    <View style={styles.row}>
      <Text weight='semibold' color='gray'>
        {label}
      </Text>
      <View style={styles.options}>
        {options.map(option => {
          const selected = option.value === selection;
          return (
            <PressableArea
              key={option.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onSelectionChange(option.value)}
            >
              <Text type='xs' color={selected ? 'gray' : 'gray.textLow'}>
                {option.label}
              </Text>
            </PressableArea>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: theme.color.background.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  chipSelected: {
    backgroundColor: theme.color.backgroundSecondary.dark,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
  row: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
});
