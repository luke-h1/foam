import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { Text } from '@app/components/ui/Text/Text';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferences/selectors';
import { theme, type ThemeMode } from '@app/styles/themes';

const THEME_MODE_OPTIONS = ['system', 'light', 'dark'] as const;

export function ThemePreferenceScreen() {
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const selectedTheme = usePreference('theme');
  const update = useUpdatePreferences();

  const themeModeLabels: Record<ThemeMode, string> = {
    system: t('themeModeSystem'),
    light: t('themeModeLight'),
    dark: t('themeModeDark'),
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <View style={styles.content}>
        <SegmentedControl
          currentIndex={Math.max(THEME_MODE_OPTIONS.indexOf(selectedTheme), 0)}
          items={THEME_MODE_OPTIONS.map(option => ({
            label: themeModeLabels[option],
          }))}
          onChange={index => {
            const next = THEME_MODE_OPTIONS[index];
            if (next) {
              update({ theme: next });
            }
          }}
        />
        <Text type='sm' color='gray.textLow'>
          {t('themeModeFootnote')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: theme.space16,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
});
