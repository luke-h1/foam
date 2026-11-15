import { Children, Fragment, isValidElement } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SettingsSectionProps } from '@app/components/settings-section/SettingsSection.types';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

export function SettingsSection({
  title,
  footer,
  children,
  cardColor,
}: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text
          type='footnote'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          {title}
        </Text>
      ) : null}

      <View
        style={[styles.card, cardColor ? { backgroundColor: cardColor } : null]}
      >
        {Children.toArray(children).map((child, index, rows) => (
          <Fragment
            key={isValidElement(child) ? String(child.key) : 'settings-row'}
          >
            {child}
            {index < rows.length - 1 ? <View style={styles.separator} /> : null}
          </Fragment>
        ))}
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  footer: {
    marginTop: theme.space8,
    paddingHorizontal: theme.space16,
  },
  section: {
    gap: theme.space8,
    marginBottom: theme.space24,
  },
  sectionTitle: {
    paddingHorizontal: theme.space16,
  },
  separator: {
    backgroundColor: theme.colorBorderSecondary,
    height: StyleSheet.hairlineWidth,
    marginLeft: theme.space16,
  },
});
