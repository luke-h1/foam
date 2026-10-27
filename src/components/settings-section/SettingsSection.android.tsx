// "Shapes" is the @expo/ui clip API, not a name this file chose.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Column,
  HorizontalDivider,
  ListItem,
  type ListItemColors,
  RNHostView,
  Row,
  Switch,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  alpha,
  background,
  clickable,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';

import { FoamComposeHost } from '@app/components/compose-host/FoamComposeHost';
import {
  resolveIconName,
  type RowIcon,
} from '@app/components/settings-section/SettingsSection.types';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { iosMatchedSwitchColors } from '@app/styles/compose-switch-colors';
import { theme } from '@app/styles/themes';

function isComposeRow(element: ReactNode): boolean {
  if (!isValidElement(element)) {
    return false;
  }

  const { type } = element;

  return (
    type === SettingsRow ||
    type === SettingsLinkRow ||
    type === SettingsToggleRow ||
    (type instanceof Object &&
      'isComposeRow' in type &&
      type.isComposeRow === true)
  );
}

const listItemColors = {
  containerColor: theme.color.surfaceNeutral.dark,
  contentColor: theme.color.text.dark,
} satisfies ListItemColors;

function IconTile({
  icon,
  danger,
}: {
  icon: NonNullable<RowIcon>;
  danger?: boolean;
}) {
  return (
    <View style={[styles.iconWrap, danger ? styles.iconWrapDanger : null]}>
      <SymbolView
        name={resolveIconName(icon.icon, icon.androidIcon)}
        size={20}
        tintColor={danger ? theme.colorRed : theme.color.textSecondary.dark}
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
        <IconTile {...{ icon, danger }} />
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
          style={{ typography: 'titleMedium' }}
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

function getRowModifiers(
  onPress: (() => void) | undefined,
  disabled: boolean | undefined,
) {
  if (disabled) {
    return [alpha(0.4)];
  }

  return onPress ? [clickable(onPress, { indication: true })] : [];
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
  return (
    <ListItem
      colors={listItemColors}
      modifiers={getRowModifiers(onPress, disabled)}
    >
      <RowLeading {...{ icon, danger }} />
      <RowText {...{ title, subtitle, danger }} />
      {trailing || (onPress && chevron) ? (
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

interface SettingsToggleRowProps {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggleRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
}: SettingsToggleRowProps) {
  return (
    <ListItem colors={listItemColors}>
      <RowLeading icon={icon} />
      <RowText {...{ title, subtitle }} />
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

interface SettingsLinkRowProps {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export function SettingsLinkRow({
  title,
  subtitle,
  icon,
  value,
  onPress,
  danger,
}: SettingsLinkRowProps) {
  return (
    <ListItem
      colors={listItemColors}
      modifiers={onPress ? [clickable(onPress, { indication: true })] : []}
    >
      <RowLeading {...{ icon, danger }} />
      <RowText {...{ title, subtitle, danger }} />
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
    width: '100%',
  },
  host: {
    marginBottom: theme.space24,
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
});
