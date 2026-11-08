import { StyleSheet } from 'react-native';

import {
  Form,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';

import { updatePreferences } from '@app/store/preference-store';

import { FormNavigationRow } from './components/FormNavigationRow';
import { useDevtoolsToggleValues } from './hooks/use-devtools-toggle-values';
import {
  DEVTOOLS_DIAGNOSTICS_ROUTES,
  DEVTOOLS_ROUTES,
  DEVTOOLS_TOGGLE_SECTIONS,
  type SettingsMenuRow,
} from './util/settingsMenu';

function NavigationRows({ rows }: { rows: SettingsMenuRow[] }) {
  return rows.map(row => (
    <FormNavigationRow
      key={row.label}
      label={row.label}
      systemImage={row.icon}
      onPress={row.onPress}
    />
  ));
}

export function SettingsDevtoolsScreen() {
  const toggleValues = useDevtoolsToggleValues();

  return (
    <Host style={styles.host}>
      <Form>
        <Section title='Diagnostics'>
          <NavigationRows rows={DEVTOOLS_DIAGNOSTICS_ROUTES} />
        </Section>

        {DEVTOOLS_TOGGLE_SECTIONS.map(section => (
          <Section key={section.title} title={section.title}>
            {section.toggles.map(toggle => (
              <Toggle
                key={toggle.key}
                isOn={toggleValues[toggle.key]}
                onIsOnChange={value =>
                  updatePreferences({ [toggle.key]: value })
                }
              >
                <NativeText>{toggle.label}</NativeText>
                <NativeText>{toggle.subtitle}</NativeText>
              </Toggle>
            ))}
          </Section>
        ))}

        <Section title='Developer Tools'>
          <NavigationRows rows={DEVTOOLS_ROUTES} />
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
