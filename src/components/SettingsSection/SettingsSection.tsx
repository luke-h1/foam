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
  danger,
}: {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  trailing?: ReactNode;
  onPress?: () => void;
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
            size={18}
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

  return <PressableArea onPress={onPress}>{content}</PressableArea>;
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
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    gap: theme.space8,
  },
  footer: {
    marginTop: theme.space12,
    paddingHorizontal: theme.space12,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: theme.colorAccentSurface,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconWrapDanger: {
    backgroundColor: theme.colorRedSurface,
    borderColor: theme.colorRedBorderUi,
  },
  linkTrailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: theme.space16,
    minHeight: 64,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space16,
  },
  section: {
    gap: theme.space12,
    marginBottom: theme.space28,
  },
  sectionTitle: {
    letterSpacing: 1.1,
    paddingHorizontal: theme.space12,
    textTransform: 'uppercase',
  },
});
