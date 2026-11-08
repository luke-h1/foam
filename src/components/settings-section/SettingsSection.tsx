import { Children, Fragment, isValidElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableArea } from '@app/components/pressable-area/PressableArea';
import { SegmentedControl } from '@app/components/segmented-control/SegmentedControl';
import {
  getOptionIndex,
  resolveIconName,
  type SettingsLinkRowProps,
  type SettingsRowProps,
  type SettingsSectionProps,
  type SettingsSegmentedRowProps,
  type SettingsToggleRowProps,
} from '@app/components/settings-section/SettingsSection.types';
import { Switch } from '@app/components/switch/Switch';
import { SymbolView } from '@app/components/ui/icon/Icon';
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

export function SettingsRow({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  danger,
  disabled,
  chevron = true,
}: SettingsRowProps) {
  const content = (
    <View style={[styles.row, disabled ? styles.disabled : null]}>
      {icon ? (
        <View style={[styles.iconWrap, danger ? styles.iconWrapDanger : null]}>
          <SymbolView
            name={resolveIconName(icon.icon, icon.androidIcon)}
            size={20}
            tintColor={danger ? theme.colorRed : theme.color.textSecondary.dark}
          />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text color={danger ? 'red' : 'gray'}>{title}</Text>
        {subtitle ? (
          <Text type='subhead' color='gray.textLow'>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ??
        (onPress && chevron ? (
          <SymbolView
            name='chevron.right'
            size={18}
            tintColor={theme.colorGreyHoverAlpha}
          />
        ) : null)}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressableArea
      accessibilityLabel={title}
      accessibilityRole='button'
      {...(disabled ? { accessibilityState: { disabled }, disabled } : {})}
      onPress={onPress}
    >
      {content}
    </PressableArea>
  );
}

export function SettingsToggleRow({
  onValueChange,
  value,
  ...rowProps
}: SettingsToggleRowProps) {
  return (
    <SettingsRow
      {...rowProps}
      trailing={
        <View>
          <Switch
            accessibilityLabel={rowProps.title}
            value={value}
            onValueChange={onValueChange}
          />
        </View>
      }
    />
  );
}

export function SettingsLinkRow({
  value,
  onPress,
  ...rowProps
}: SettingsLinkRowProps) {
  return (
    <SettingsRow
      {...rowProps}
      trailing={
        <View style={styles.linkTrailing}>
          {value ? (
            <Text type='body' color='gray.textLow'>
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <SymbolView
              name='chevron.right'
              size={18}
              tintColor={theme.colorGreyHoverAlpha}
            />
          ) : null}
        </View>
      }
      {...{ onPress }}
    />
  );
}

export function SettingsSegmentedRow<Value>({
  title,
  subtitle,
  icon,
  options,
  value,
  onValueChange,
}: SettingsSegmentedRowProps<Value>) {
  const handleChange = (index: number) => {
    const option = options[index];

    if (option) {
      onValueChange(option.value);
    }
  };

  return (
    <View>
      <SettingsRow {...{ title, subtitle, icon }} />
      <View style={styles.segmentedControl}>
        <SegmentedControl
          items={options}
          currentIndex={getOptionIndex(options, value)}
          onChange={handleChange}
        />
      </View>
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
  copy: {
    flex: 1,
    gap: theme.space8,
    minWidth: 0,
  },
  disabled: {
    opacity: 0.4,
  },
  footer: {
    marginTop: theme.space8,
    paddingHorizontal: theme.space16,
  },
  iconWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.sm,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  iconWrapDanger: {
    opacity: 0.9,
  },
  linkTrailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 56,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
  segmentedControl: {
    paddingBottom: theme.space12,
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
