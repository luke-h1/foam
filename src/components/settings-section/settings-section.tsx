import { Children, Fragment, isValidElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableArea } from '@app/components/pressable-area/pressable-area';
import {
  resolveIconName,
  type RowIcon,
} from '@app/components/settings-section/settings-section.types';
import { Switch } from '@app/components/switch/switch';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

interface SettingsSectionProps {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  cardColor?: string;
}

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

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  trailing?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  /**
   * A pressable row shows a chevron unless this is false. Action rows that
   * run in place, rather than open a screen, turn it off.
   */
  chevron?: boolean;
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
      accessibilityState={disabled ? { disabled } : undefined}
      disabled={disabled}
      onPress={onPress}
    >
      {content}
    </PressableArea>
  );
}

export function SettingsToggleRow(props: {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { onValueChange, value, ...rowProps } = props;

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

export function SettingsLinkRow(props: {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { value, onPress, ...rowProps } = props;

  return (
    <SettingsRow
      {...rowProps}
      onPress={onPress}
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
    />
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
