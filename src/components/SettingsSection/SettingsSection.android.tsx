import { Children, Fragment, isValidElement, ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import {
  Card,
  CardColors,
  Column,
  HorizontalDivider,
  Host,
  ListItem,
  ListItemColors,
  RNHostView,
  Row,
  Switch,
  Text,
} from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import {
  type ComposeRowComponent,
  resolveIconName,
  type RowIcon,
} from '@app/components/SettingsSection/SettingsSection.types';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { iosMatchedSwitchColors } from '@app/styles/composeSwitchColors';
import { type ColorScheme, theme } from '@app/styles/themes';

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

function getListItemColors(scheme: ColorScheme) {
  return {
    containerColor: theme.color.surfaceNeutral[scheme],
    contentColor: theme.color.text[scheme],
  } satisfies ListItemColors;
}

function getDefaultCardColors(scheme: ColorScheme) {
  return {
    containerColor: theme.color.surfaceNeutral[scheme],
    contentColor: theme.color.text[scheme],
  } satisfies CardColors;
}

function IconTile({
  icon,
  danger,
}: {
  icon: NonNullable<RowIcon>;
  danger?: boolean;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
        tintColor={icon.color || theme.color.accent[scheme]}
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <>
      <ListItem.HeadlineContent>
        <Text
          color={danger ? theme.color.danger[scheme] : theme.color.text[scheme]}
          style={{ typography: 'bodyLarge', fontWeight: '600' }}
        >
          {title}
        </Text>
      </ListItem.HeadlineContent>
      {subtitle ? (
        <ListItem.SupportingContent>
          <Text
            color={theme.color.textSecondary[scheme]}
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const rows = Children.toArray(children).filter(isValidElement);
  const cardColors = cardColor
    ? { containerColor: cardColor, contentColor: theme.color.text[scheme] }
    : getDefaultCardColors(scheme);

  return (
    <Host
      colorScheme={scheme}
      matchContents={{ vertical: true }}
      style={styles.host}
    >
      <Column
        modifiers={[fillMaxWidth()]}
        verticalArrangement={{ spacedBy: 8 }}
      >
        {title ? (
          <Text
            color={theme.color.textSecondary[scheme]}
            style={{ typography: 'labelSmall', fontWeight: '600' }}
          >
            {title}
          </Text>
        ) : null}
        <Card colors={cardColors} modifiers={[fillMaxWidth()]}>
          <Column modifiers={[fillMaxWidth()]}>
            {rows.map((row, index) => (
              <Fragment key={row.key}>
                {index > 0 ? (
                  <HorizontalDivider color={theme.color.border[scheme]} />
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
  danger?: boolean;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <ListItem
      colors={getListItemColors(scheme)}
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
                tintColor={theme.color.textSecondary[scheme]}
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <ListItem colors={getListItemColors(scheme)}>
      <RowLeading icon={icon} />
      <RowText title={title} subtitle={subtitle} />
      <ListItem.TrailingContent>
        <Switch
          value={value}
          onCheckedChange={onValueChange}
          colors={iosMatchedSwitchColors[scheme]}
        />
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <ListItem
      colors={getListItemColors(scheme)}
      modifiers={onPress ? [clickable(onPress, { indication: true })] : []}
    >
      <RowLeading icon={icon} danger={danger} />
      <RowText title={title} subtitle={subtitle} danger={danger} />
      {value || onPress ? (
        <ListItem.TrailingContent>
          <Row
            verticalAlignment='center'
            horizontalArrangement={{ spacedBy: 8 }}
          >
            {value ? (
              <Text
                color={theme.color.textSecondary[scheme]}
                style={{ typography: 'bodyMedium', fontWeight: '600' }}
              >
                {value}
              </Text>
            ) : null}
            {onPress ? (
              <RNHostView matchContents>
                <SymbolView
                  name='chevron.right'
                  size={18}
                  tintColor={theme.color.textSecondary[scheme]}
                />
              </RNHostView>
            ) : null}
          </Row>
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
});
