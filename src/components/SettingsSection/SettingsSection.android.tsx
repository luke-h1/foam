import { Children, Fragment, isValidElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Card,
  CardColors,
  Column,
  HorizontalDivider,
  Host,
  ListItem,
  RNHostView,
  Switch,
  Text,
} from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { AndroidSymbol } from '@app/components/ui/Icon/Icon';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text as RNText } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

type RowIcon =
  | {
      color?: string;
      icon: SFSymbol;
      androidIcon?: AndroidSymbol;
    }
  | undefined;

function resolveIconName(
  icon: SFSymbol,
  androidIcon: AndroidSymbol | undefined,
): SymbolViewProps['name'] {
  if (!androidIcon) {
    return icon;
  }
  return { ios: icon, android: androidIcon, web: androidIcon };
}

/**
 * Marker for components that render as native Compose children and can sit
 * directly inside the Card's Column. Screens with bespoke Compose rows (e.g.
 * the chat-preferences segmented rows) tag their component with this so they
 * are not hosted via RNHostView, which would place their Compose content
 * outside the Card tree.
 */
export interface ComposeRowComponent {
  isComposeRow?: boolean;
}

/**
 * Only Compose row components can render as direct children of the Card's
 * Column. Any other child (RN preview tiles etc.) is hosted via RNHostView.
 */
function isComposeRow(element: ReactNode): boolean {
  if (!isValidElement(element)) {
    return false;
  }
  const { type } = element;
  return (
    type === SettingsRow ||
    type === SettingsLinkRow ||
    type === SettingsToggleRow ||
    (typeof type !== 'string' &&
      (type as ComposeRowComponent).isComposeRow === true)
  );
}

const listItemColors = {
  containerColor: theme.color.backgroundSecondary.dark,
  contentColor: theme.color.text.dark,
};

const defaultCardColors = {
  containerColor: theme.color.backgroundSecondary.dark,
  contentColor: theme.color.text.dark,
} satisfies CardColors;

function IconTile({
  icon,
  danger,
}: {
  icon: NonNullable<RowIcon>;
  danger?: boolean;
}) {
  return (
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
  );
}

function RowLeading({ icon, danger }: { icon?: RowIcon; danger?: boolean }) {
  if (!icon) {
    return null;
  }
  return (
    <ListItem.LeadingContent>
      <RNHostView matchContents>
        <IconTile icon={icon} danger={danger} />
      </RNHostView>
    </ListItem.LeadingContent>
  );
}

function RowText({
  title,
  subtitle,
  danger,
}: {
  title: string;
  subtitle?: string;
  danger?: boolean;
}) {
  return (
    <>
      <ListItem.HeadlineContent>
        <Text
          color={danger ? theme.colorRed : theme.color.text.dark}
          style={{ typography: 'bodyLarge', fontWeight: '600' }}
        >
          {title}
        </Text>
      </ListItem.HeadlineContent>
      {subtitle ? (
        <ListItem.SupportingContent>
          <Text
            color={theme.color.textSecondary.dark}
            style={{ typography: 'bodyMedium' }}
          >
            {subtitle}
          </Text>
        </ListItem.SupportingContent>
      ) : null}
    </>
  );
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
  const rows = Children.toArray(children).filter(isValidElement);
  const cardColors = cardColor
    ? { containerColor: cardColor, contentColor: theme.color.text.dark }
    : defaultCardColors;

  return (
    <Host
      colorScheme='dark'
      matchContents={{ vertical: true }}
      style={styles.host}
    >
      <Column
        modifiers={[fillMaxWidth()]}
        verticalArrangement={{ spacedBy: 8 }}
      >
        {title ? (
          <Text
            color={theme.color.textSecondary.dark}
            style={{ typography: 'labelSmall', fontWeight: '600' }}
          >
            {title}
          </Text>
        ) : null}
        <Card colors={cardColors} modifiers={[fillMaxWidth()]}>
          <Column modifiers={[fillMaxWidth()]}>
            {rows.map((row, index) => (
              <Fragment key={index}>
                {index > 0 ? (
                  <HorizontalDivider color={theme.colorBorderSecondary} />
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
        </Card>
        {footer ? (
          <RNHostView matchContents>
            <View style={styles.footer}>{footer}</View>
          </RNHostView>
        ) : null}
      </Column>
    </Host>
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
  accessibilityRole?: 'button' | 'switch';
  accessibilityState?: { checked?: boolean };
  danger?: boolean;
}) {
  return (
    <ListItem
      colors={listItemColors}
      modifiers={onPress ? [clickable(onPress, { indication: true })] : []}
    >
      <RowLeading icon={icon} danger={danger} />
      <RowText title={title} subtitle={subtitle} danger={danger} />
      {trailing || onPress ? (
        <ListItem.TrailingContent>
          <RNHostView matchContents>
            {trailing ? (
              <View>{trailing}</View>
            ) : (
              <SymbolView
                name='chevron.right'
                size={18}
                tintColor={theme.colorGreyHoverAlpha}
              />
            )}
          </RNHostView>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}

export function SettingsToggleRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
}: {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <ListItem colors={listItemColors}>
      <RowLeading icon={icon} />
      <RowText title={title} subtitle={subtitle} />
      <ListItem.TrailingContent>
        <Switch value={value} onCheckedChange={onValueChange} />
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export function SettingsLinkRow({
  title,
  subtitle,
  icon,
  value,
  onPress,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <ListItem
      colors={listItemColors}
      modifiers={onPress ? [clickable(onPress, { indication: true })] : []}
    >
      <RowLeading icon={icon} danger={danger} />
      <RowText title={title} subtitle={subtitle} danger={danger} />
      {value || onPress ? (
        <ListItem.TrailingContent>
          <RNHostView matchContents>
            <View style={styles.linkTrailing}>
              {value ? (
                <RNText type='sm' color='gray.textLow' weight='semibold'>
                  {value}
                </RNText>
              ) : null}
              {onPress ? (
                <SymbolView
                  name='chevron.right'
                  size={18}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              ) : null}
            </View>
          </RNHostView>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space4,
  },
  host: {
    marginBottom: theme.space24,
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
    justifyContent: 'flex-end',
  },
});
