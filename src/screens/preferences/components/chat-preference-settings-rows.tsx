import { View } from 'react-native';
import type { ComponentProps } from 'react';

import { SettingsRow } from '@app/components/settings-section/settings-section';

import { ChatPreferenceSegmentedTrailing } from './chat-preference-segmented-trailing';

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
