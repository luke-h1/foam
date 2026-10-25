import { View } from 'react-native';
import type { ComponentProps } from 'react';

import { SettingsRow } from '@app/components/settings-section/SettingsSection';

import { ChatPreferenceSegmentedTrailing } from './ChatPreferenceSegmentedTrailing';

type SettingsRowIcon = ComponentProps<typeof SettingsRow>['icon'];

interface ChatPreferenceSegmentedSettingsRowProps {
  title: string;
  subtitle: string;
  icon: SettingsRowIcon;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  values: readonly string[];
}

export function ChatPreferenceSegmentedSettingsRow({
  title,
  subtitle,
  icon,
  selectedIndex,
  onSelectIndex,
  values,
}: ChatPreferenceSegmentedSettingsRowProps) {
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
