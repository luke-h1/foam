import { Children, Fragment, isValidElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SFSymbol } from 'sf-symbols-typescript';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Switch } from '@app/components/Switch/Switch';
import type { AndroidSymbol } from '@app/components/ui/Icon/Icon';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

type RowIcon =
  | {
      color?: string;
      icon: SFSymbol;
      androidIcon?: AndroidSymbol;
    }
  | undefined;

/**
 * Marker consumed by the Android Compose `SettingsSection` to place bespoke
 * Compose rows directly in the Card. No effect on iOS/web, which render
 * children as plain RN views.
 */
export interface ComposeRowComponent {
  isComposeRow?: boolean;
}

function resolveIconName(
  icon: SFSymbol,
  androidIcon: AndroidSymbol | undefined,
): SymbolViewProps['name'] {
  if (!androidIcon) {
    return icon;
  }
  return { ios: icon, android: androidIcon, web: androidIcon };
}

export function SettingsSection({
  title,
  footer,
  children,
  cardColor,
}: {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  cardColor?: string;
}) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text
          type='xs'
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
          <SymbolView
            name={resolveIconName(icon.icon, icon.androidIcon)}
            size={20}
            tintColor={icon.color || theme.colorPrimary}
          />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text weight='semibold' color={danger ? 'red' : 'gray'}>
          {title}
        </Text>
        {subtitle ? (
          <Text type='xs' color='gray.textLow'>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ??
        (onPress ? (
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
            <Text type='sm' color='gray.textLow' weight='semibold'>
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
    borderRadius: theme.borderRadius18,
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
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
