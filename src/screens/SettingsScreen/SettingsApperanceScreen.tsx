import { Menu, MenuItem } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { Slider } from '@app/components/Slider';
import { Preferences, usePreferences } from '@app/store/preferenceStore';
import { StyleSheet } from 'react-native-unistyles';

function FontScaleSlider() {
  const { fontScaling, systemScaling, update } = usePreferences();

  return (
    <Slider
      disabled={systemScaling}
      max={1.2}
      min={0.8}
      onChange={next => {
        update({
          fontScaling: next,
        });
      }}
      step={0.1}
      style={styles.slider}
      value={fontScaling}
    />
  );
}

function renderFontScaleSlider() {
  return <FontScaleSlider />;
}

export function SettingsAppearanceScreen() {
  const { theme, hapticFeedback, update } = usePreferences();

  return (
    <Screen safeAreaEdges={[]} preset="fixed">
      <Menu
        header={
          <ScreenHeader
            title="Appearance"
            subtitle="Theme, colors & display"
            size="medium"
          />
        }
        items={[
          'Theme',
          {
            icon: {
              name: theme === 'foam-dark' ? 'moon' : 'sun.and.horizon',
              type: 'symbol',
            },
            label: 'Theme',
            onSelect: (value: string) => {
              update({ theme: value as Preferences['theme'] });
            },
            options: [
              { label: 'Dark', value: 'foam-dark' },
              { label: 'Light', value: 'foam-light' },
            ],
            title: 'Select Theme',
            type: 'options',
            value: theme,
          } satisfies MenuItem,
          null,
          'Font Size',
          renderFontScaleSlider,
          null,
          'Feedback',
          {
            icon: {
              name: 'hand.tap',
              type: 'symbol',
            },
            label: 'Haptic Feedback',
            description: 'Vibration on interactions',
            onSelect: (value: boolean) => {
              update({ hapticFeedback: value });
            },
            type: 'switch',
            value: hapticFeedback,
          } satisfies MenuItem,
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create(theme => ({
  slider: {
    marginHorizontal: theme.spacing.lg,
  },
}));
