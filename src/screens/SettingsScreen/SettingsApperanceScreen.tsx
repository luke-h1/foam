import { Slider } from '@app/components';
import { Menu, MenuItem } from '@app/components/Menu';
import { Preferences, usePreferences } from '@app/store';
import { SafeAreaView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function SettingsAppearanceScreen() {
  const { fontScaling, systemScaling, theme, update } = usePreferences();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu
        items={[
          'Theme',
          {
            key: 'theme',
            options: [
              'Auto',
              {
                value: 'foam-dark',
                key: 'foam-dark',
              },
              null,
              'Light',
              {
                key: 'foam-light',
                value: 'foam-light',
              },
            ],
            value: theme,
          },
          null,
          'Font',
          {
            key: 'fontScaling',
            value: fontScaling,
          },
        ].map(item => {
          if (item === null || typeof item === 'string') {
            return item;
          }

          if (item.key === 'theme') {
            return {
              icon: {
                name: theme === 'foam-dark' ? 'Moon' : 'Sun',
                type: 'icon',
              },
              label: theme === 'foam-dark' ? 'Dark' : 'Light',
              onSelect(value: string) {
                update({ theme: value as Preferences['theme'] });
              },
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              options: item.options!.map(opt => {
                if (opt === null || typeof opt === 'string') {
                  return opt;
                }

                return {
                  label: opt.key === 'foam-dark' ? 'Dark' : 'Light',
                  right: <View style={styles.option} />,
                  value: opt.key,
                };
              }),
              title: 'Theme',
              type: 'options',
              value: theme,
            } satisfies MenuItem;
          }

          if (item.key === 'fontScaling') {
            // eslint-disable-next-line react/no-unstable-nested-components
            return function Component() {
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
            };
          }

          return {
            label: String(item.value),
            onSelect: (value: boolean) => {
              const payload: Partial<Preferences> = {
                [item.key]: value,
              };
              update(payload);
            },
            type: 'switch',
            value: item.value as unknown as boolean,
          } satisfies MenuItem;
        })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(theme => ({
  option: {
    alignItems: 'center',
    height: theme.spacing.sm,
    width: theme.spacing.sm,
    justifyContent: 'center',
  },
  slider: {
    marginHorizontal: theme.spacing.lg,
  },
}));
