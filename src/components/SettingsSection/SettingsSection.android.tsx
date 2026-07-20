import { Children, Fragment, isValidElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

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
} from '@app/components/SettingsSection/SettingsSection.shared';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { iosMatchedSwitchColors } from '@app/styles/composeSwitchColors';
import { theme } from '@app/styles/themes';

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
  containerColor: theme.color.surfaceNeutral.dark,
  contentColor: theme.color.text.dark,
} satisfies ListItemColors;

const defaultCardColors = {
  containerColor: theme.color.surfaceNeutral.dark,
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
              <Fragment key={row.key}>
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
        <Switch
          value={value}
          onCheckedChange={onValueChange}
          colors={iosMatchedSwitchColors}
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
  return (
    <ListItem
      colors={listItemColors}
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
                color={theme.color.textSecondary.dark}
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
                  tintColor={theme.colorGreyHoverAlpha}
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
