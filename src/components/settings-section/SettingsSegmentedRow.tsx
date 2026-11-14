import { StyleSheet, View } from 'react-native';

import { SegmentedControl } from '@app/components/segmented-control/SegmentedControl';
import { SettingsRow } from '@app/components/settings-section/SettingsRow';
import {
  getOptionIndex,
  type SettingsSegmentedRowProps,
} from '@app/components/settings-section/SettingsSection.types';
import { theme } from '@app/styles/themes';

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
    <View>
      <SettingsRow {...{ title, subtitle, icon }} />
      <View style={styles.segmentedControl}>
        <SegmentedControl
          items={options}
          currentIndex={getOptionIndex(options, value)}
          onChange={handleChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    paddingBottom: theme.space12,
    paddingHorizontal: theme.space16,
  },
});
