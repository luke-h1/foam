import { Picker, Text as NativeText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { PickerRowProps } from './PickerRow.types';

export function PickerRow<T extends string>({
  label,
  options,
  selection,
  onSelectionChange,
  variant = 'menu',
}: PickerRowProps<T>) {
  return (
    <Picker
      label={label}
      selection={selection}
      modifiers={[pickerStyle(variant)]}
      onSelectionChange={value => onSelectionChange(value as T)}
    >
      {options.map(option => (
        <NativeText key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </NativeText>
      ))}
    </Picker>
  );
}
