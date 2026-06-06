import { SettingsRow } from '@app/components/SettingsSection/SettingsSection';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { ChatPreferenceSegmentedTrailing } from './ChatPreferenceSegmentedTrailing';

type SettingsRowIcon = ComponentProps<typeof SettingsRow>['icon'];

export function ChatPreferenceSegmentedSettingsRow({
  title,
  subtitle,
  icon,
  selectedIndex,
  onChange,
  onValueChange,
  values,
}: {
  title: string;
  subtitle: string;
  icon: SettingsRowIcon;
  selectedIndex: number;
  onChange: (event: { nativeEvent: { selectedSegmentIndex: number } }) => void;
  onValueChange: (value: string) => void;
  values: readonly string[];
}) {
  return (
    <View>
      <SettingsRow title={title} subtitle={subtitle} icon={icon} />
      <ChatPreferenceSegmentedTrailing
        onChange={onChange}
        onValueChange={onValueChange}
        selectedIndex={selectedIndex}
        values={values}
      />
    </View>
  );
}
