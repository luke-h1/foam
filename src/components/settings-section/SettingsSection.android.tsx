// "Shapes" is the @expo/ui clip API, not a name this file chose.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Column,
  HorizontalDivider,
  RNHostView,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';

import { FoamComposeHost } from '@app/components/compose-host/FoamComposeHost';
import { SettingsLinkRow } from '@app/components/settings-section/SettingsLinkRow';
import { SettingsRow } from '@app/components/settings-section/SettingsRow';
import type { SettingsSectionProps } from '@app/components/settings-section/SettingsSection.types';
import { SettingsSegmentedRow } from '@app/components/settings-section/SettingsSegmentedRow';
import { SettingsToggleRow } from '@app/components/settings-section/SettingsToggleRow';
import { theme } from '@app/styles/themes';

function isComposeRow(element: ReactNode): boolean {
  return (
    isValidElement(element) &&
    (element.type === SettingsRow ||
      element.type === SettingsLinkRow ||
      element.type === SettingsToggleRow ||
      element.type === SettingsSegmentedRow)
  );
}

export function SettingsSection({
  title,
  footer,
  children,
  cardColor,
}: SettingsSectionProps) {
  const rows = Children.toArray(children).filter(isValidElement);
  const groupColor = cardColor ?? theme.color.surfaceNeutral.dark;

  return (
    <FoamComposeHost matchContents={{ vertical: true }} style={styles.host}>
      <Column
        modifiers={[fillMaxWidth()]}
        verticalArrangement={{ spacedBy: 8 }}
      >
        {title ? (
          <Text
            color={theme.color.textSecondary.dark}
            modifiers={[padding(16, 0, 16, 0)]}
            style={{ typography: 'labelMedium', fontWeight: '600' }}
          >
            {title}
          </Text>
        ) : null}
        <Column
          modifiers={[
            fillMaxWidth(),
            clip(Shapes.RoundedCorner(theme.radius.lg)),
            background(groupColor),
          ]}
        >
          {rows.map((row, index) => (
            <Fragment key={row.key}>
              {index > 0 ? (
                <HorizontalDivider
                  color={theme.colorBorderSecondary}
                  modifiers={[padding(16, 0, 0, 0)]}
                  thickness={StyleSheet.hairlineWidth}
                />
              ) : null}
              {isComposeRow(row) ? (
                row
              ) : (
                <RNHostView matchContents>
                  <View>{row}</View>
                </RNHostView>
              )}
            </Fragment>
          ))}
        </Column>
        {footer ? (
          <RNHostView matchContents={{ vertical: true }}>
            <View style={styles.footer}>{footer}</View>
          </RNHostView>
        ) : null}
      </Column>
    </FoamComposeHost>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space4,
    width: '100%',
  },
  host: {
    marginBottom: theme.space24,
  },
});
