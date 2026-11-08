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
import { SegmentedButtons } from '@app/components/segmented-control/SegmentedControl.android';
import {
  getOptionIndex,
  resolveIconName,
  type RowIcon,
  type SettingsLinkRowProps,
  type SettingsRowProps,
  type SettingsSectionProps,
  type SettingsSegmentedRowProps,
  type SettingsToggleRowProps,
} from '@app/components/settings-section/SettingsSection.types';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { iosMatchedSwitchColors } from '@app/styles/compose-switch-colors';
import { theme } from '@app/styles/themes';

/**
 * The rows this module draws in Compose. A section places them in its Compose
 * column as they are and hosts every other child in an RN view.
 */
function isComposeRow(element: ReactNode): boolean {
  return (
    isValidElement(element) &&
    (element.type === SettingsRow ||
      element.type === SettingsLinkRow ||
      element.type === SettingsToggleRow ||
      element.type === SettingsSegmentedRow)
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
    <Column modifiers={[fillMaxWidth()]}>
      <SettingsRow {...{ title, subtitle, icon }} />
      <Row modifiers={[fillMaxWidth(), padding(16, 0, 16, 12)]}>
        <SegmentedButtons
          items={options}
          currentIndex={getOptionIndex(options, value)}
          onChange={handleChange}
        />
      </Row>
    </Column>
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
