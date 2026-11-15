import { Column, Row } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';

import { SegmentedButtons } from '@app/components/segmented-control/SegmentedControl.android';
import { SettingsRow } from '@app/components/settings-section/SettingsRow';
import {
  getOptionIndex,
  type SettingsSegmentedRowProps,
} from '@app/components/settings-section/SettingsSection.types';

export function SettingsSegmentedRow<Value>({
  title,
  subtitle,
  icon,
  options,
  value,
  onValueChange,
}: SettingsSegmentedRowProps<Value>) {
  const handleChange = (index: number) => {
    const option = options[index];

    if (option) {
      onValueChange(option.value);
    }
  };

  return (
    <Column modifiers={[fillMaxWidth()]}>
      <SettingsRow {...{ title, subtitle, icon }} />
      <Row modifiers={[fillMaxWidth(), padding(16, 0, 16, 12)]}>
        <SegmentedButtons
          items={options}
          currentIndex={getOptionIndex(options, value)}
          onChange={handleChange}
        />
      </Row>
    </Column>
  );
}
