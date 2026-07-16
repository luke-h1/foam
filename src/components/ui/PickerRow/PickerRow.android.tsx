import {
  Column,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';

import { theme } from '@app/styles/themes';

import { PickerRowProps } from './PickerRow.types';

export function PickerRow<T extends string>({
  label,
  options,
  selection,
  onSelectionChange,
}: PickerRowProps<T>) {
  return (
    <Column
      modifiers={[fillMaxWidth(), padding(16, 12, 16, 12)]}
      verticalArrangement={{ spacedBy: 8 }}
    >
      <Text
        color={theme.color.text.dark}
        style={{ typography: 'bodyLarge', fontWeight: '600' }}
      >
        {label}
      </Text>
      <SingleChoiceSegmentedButtonRow>
        {options.map(option => (
          <SegmentedButton
            key={option.value}
            selected={option.value === selection}
            onClick={() => onSelectionChange(option.value)}
          >
            <SegmentedButton.Label>
              <Text style={{ typography: 'labelLarge' }}>{option.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Column>
  );
}
