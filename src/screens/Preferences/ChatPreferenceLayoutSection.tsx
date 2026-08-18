import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import type { ChatFontScale } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';

import { DensityPreview } from './ChatPreferencePreviewWidgets';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import { DENSITY_OPTIONS, FONT_SCALE_OPTIONS } from './chatPreferenceTypes';

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
}: {
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
}) {
  return (
    <SettingsSection title='Layout'>
      <ChatPreferenceSegmentedSettingsRow
        icon={{
          icon: 'list.bullet',
          androidIcon: 'format_list_bulleted',
          color: theme.colorGrey,
        }}
        onSelectIndex={handleDensityChange}
        selectedIndex={densityIndex}
        subtitle={
          previewDensity === 'compact'
            ? 'Tighter rows for faster scanning'
            : 'Roomier rows with more breathing space'
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
          color: theme.colorGrey,
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
        subtitle='Add subtle striping between chat lines'
        icon={{
          icon: 'line.3.horizontal',
          androidIcon: 'menu',
          color: theme.colorGrey,
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
        subtitle='Slide new messages into view as they arrive'
        icon={{
          icon: 'arrow.up.message',
          androidIcon: 'animation',
          color: theme.colorGrey,
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
