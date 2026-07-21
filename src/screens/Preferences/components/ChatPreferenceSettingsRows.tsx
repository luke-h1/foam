import { View } from 'react-native';
import type { ComponentProps } from 'react';

import { SettingsRow } from '@app/components/SettingsSection/SettingsSection';

import { ChatPreferenceSegmentedTrailing } from './ChatPreferenceSegmentedTrailing';

type SettingsRowIcon = ComponentProps<typeof SettingsRow>['icon'];

export function ChatPreferenceSegmentedSettingsRow({
  title,
  subtitle,
  icon,
  selectedIndex,
  onSelectIndex,
  values,
}: {
  title: string;
  subtitle: string;
  icon: SettingsRowIcon;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  values: readonly string[];
}) {
  return (
    <View>
      <SettingsRow title={title} subtitle={subtitle} icon={icon} />
      <ChatPreferenceSegmentedTrailing
        onSelectIndex={onSelectIndex}
        selectedIndex={selectedIndex}
        values={values}
      />
    </View>
  );
}
