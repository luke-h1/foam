import { Icon } from '@app/components/Icon/Icon';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type RowIcon =
  | {
      color?: string;
      icon: string;
    }
  | undefined;

export function SettingsSection({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text
          type="xs"
          weight="semibold"
          color="gray.textLow"
          style={styles.sectionTitle}
        >
          {title}
        </Text>
      ) : null}

      <View style={styles.card}>{children}</View>

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
  accessibilityRole,
  accessibilityState,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityRole?: 'button' | 'switch';
  accessibilityState?: {
    checked?: boolean;
  };
  danger?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            danger ? styles.iconWrapDanger : null,
            icon.color ? { backgroundColor: `${icon.color}20` } : null,
          ]}
        >
          <Icon
            icon={icon.icon}
            size={20}
            color={icon.color || theme.colorDarkGreen}
          />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text weight="semibold" color={danger ? 'red' : 'gray'}>
          {title}
        </Text>
        {subtitle ? (
          <Text type="xs" color="gray.textLow">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ?? (onPress ? <Icon icon="chevron-right" size={18} /> : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <PressableArea
      accessibilityLabel={title}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={accessibilityState}
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
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      trailing={<Switch value={value} onValueChange={onValueChange} />}
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
            <Text type="sm" color="gray.textLow" weight="semibold">
              {value}
            </Text>
          ) : null}
          {onPress ? <Icon icon="chevron-right" size={18} /> : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    gap: theme.space8,
    minWidth: 0,
  },
  footer: {
    marginTop: theme.space8,
    paddingHorizontal: theme.space16,
  },
  iconWrap: {
    alignItems: 'center',
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
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
});
