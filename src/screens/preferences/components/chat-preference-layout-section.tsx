import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';
import type { ChatFontScale } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import {
  DENSITY_OPTIONS,
  FONT_SCALE_OPTIONS,
} from '../util/chat-preference-types';
import { DensityPreview } from './chat-preference-preview-widgets';
import { ChatPreferenceSegmentedSettingsRow } from './chat-preference-settings-rows';
import { ChatPreferencePreview } from './chat-preferences-preview';

interface ChatPreferenceLayoutSectionProps {
  animate: boolean;
  densityIndex: number;
  fontScaleIndex: number;
  handleDensityChange: (index: number) => void;
  handleFontScaleChange: (index: number) => void;
  onAlternatingRowsToggle: (value: boolean) => void;
  onAnimateChange: (value: boolean) => void;
  previewAlternatingRows: boolean;
  previewDensity: 'comfortable' | 'compact';
  previewFontScale: ChatFontScale;
}

export function ChatPreferenceLayoutSection({
  animate,
  densityIndex,
  fontScaleIndex,
  handleDensityChange,
  handleFontScaleChange,
  onAnimateChange,
  previewAlternatingRows,
  previewFontScale,
  previewDensity,
  onAlternatingRowsToggle,
}: ChatPreferenceLayoutSectionProps) {
  return (
    <SettingsSection title='Layout'>
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'list.bullet',
          androidIcon: 'format_list_bulleted',
        }}
        onSelectIndex={handleDensityChange}
        selectedIndex={densityIndex}
        subtitle={
          previewDensity === 'compact'
            ? 'Tighter rows for faster scanning'
            : 'More space between rows'
        }
        title='Message Density'
        values={DENSITY_OPTIONS.map(option => option.label)}
      />
      <View style={styles.settingsPreviewItem}>
        <DensityPreview density={previewDensity} />
      </View>
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'textformat.size',
          androidIcon: 'format_size',
        }}
        onSelectIndex={handleFontScaleChange}
        selectedIndex={fontScaleIndex}
        subtitle='Scales message text, usernames, and mentions'
        title='Font Size'
        values={FONT_SCALE_OPTIONS.map(option => option.label)}
      />
      <View style={styles.settingsPreviewItem}>
        <ChatPreferencePreview variant='fontScale' value={previewFontScale} />
      </View>
      <SettingsToggleRow
        title='Alternating Rows'
        subtitle='Stripe alternate chat lines'
        icon={{
          icon: 'line.3.horizontal',
          androidIcon: 'menu',
        }}
        value={previewAlternatingRows}
        onValueChange={onAlternatingRowsToggle}
      />
      <View style={styles.settingsPreviewItem}>
        <ChatPreferencePreview
          variant='alternatingRows'
          value={previewAlternatingRows}
        />
      </View>
      <SettingsToggleRow
        title='New Message Animation'
        subtitle='Slide in new messages'
        icon={{
          icon: 'arrow.up.message',
          androidIcon: 'animation',
        }}
        value={animate}
        onValueChange={onAnimateChange}
      />
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
