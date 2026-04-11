/* eslint-disable no-nested-ternary */
import { theme } from '@app/styles/themes';
import { SymbolView } from 'expo-symbols';
import { type ReactElement, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
// eslint-disable-next-line no-restricted-imports
import { Pressable } from 'react-native';
import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Icon } from '@app/components/Icon/Icon';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { type Icon as MenuIcon, type MenuItemOption } from '@app/components/Menu/Menu';
import { SheetItem } from '@app/components/sheets/SheetItem';
import { SheetModal } from '@app/components/sheets/SheetModal';

type PreviewMenuItemProps = {
  description?: string;
  icon?: MenuIcon;
  label: string;
  preview: ReactElement;
} & (
  | {
      onSelect: (value: string) => void;
      options: Array<MenuItemOption | string | null>;
      title?: string;
      type: 'options';
      value?: string | boolean | number;
    }
  | {
      onSelect: (value: boolean) => void;
      type: 'switch';
      value: boolean;
    }
);

function renderIcon(icon: MenuIcon, defaultColor: string) {
  if (icon.type === 'symbol') {
    return (
      <SymbolView name={icon.name} tintColor={icon.color ?? defaultColor} />
    );
  }

  if (icon.type === 'brandIcon') {
    return (
      <BrandIcon
        name={icon.name}
        color={icon.color ?? defaultColor}
        size="md"
      />
    );
  }

  return <Icon icon={icon.name} color={icon.color ?? defaultColor} />;
}

function isMenuItemOption(
  option: MenuItemOption | string | null,
): option is MenuItemOption {
  return typeof option === 'object' && option !== null;
}

export function ChatPreferenceMenuItem(props: PreviewMenuItemProps) {
  const [sheetVisible, setSheetVisible] = useState(false);

  const selected = useMemo(() => {
    if (props.type === 'options') {
      const $selected = props.options
        .filter(isMenuItemOption)
        .find(option => option?.value === props.value);

      return $selected?.right ?? $selected?.label ?? $selected?.value;
    }

    return null;
  }, [props]);

  const row = (
    <View style={styles.row}>
      {props.icon ? renderIcon(props.icon, theme.colors.gray.border) : null}

      <View style={styles.contentContainer}>
        <Text weight="semibold">{props.label}</Text>

        {props.description ? (
          <Text type="xs" color="gray.textLow">
            {props.description}
          </Text>
        ) : null}
      </View>

      {typeof selected === 'string' ? (
        <Text color="gray" weight="bold">
          {selected}
        </Text>
      ) : (
        selected
      )}

      {props.type === 'switch' ? (
        <Switch
          onValueChange={value => {
            props.onSelect(value);
          }}
          value={props.value}
        />
      ) : null}
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        {props.type === 'options' ? (
          <Pressable
            onPress={() => {
              setSheetVisible(true);
            }}
          >
            {row}
          </Pressable>
        ) : (
          row
        )}

        <View style={styles.previewSection}>{props.preview}</View>
      </View>

      {props.type === 'options' ? (
        <SheetModal
          container={props.options.length > 6 ? 'scroll' : 'view'}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title={props.title ?? props.label}
        >
          {props.options.map((option, index) => {
            if (option === null) {
              return (
                <View
                  style={styles.separator}
                  // eslint-disable-next-line react/no-array-index-key
                  key={`separator-${index}`}
                />
              );
            }

            if (typeof option === 'string') {
              return (
                <Text
                  highContrast={false}
                  key={option}
                  mb="sm"
                  mt="sm"
                  mx="sm"
                  type="md"
                  weight="semibold"
                >
                  {option}
                </Text>
              );
            }

            return (
              <SheetItem
                icon={'icon' in option ? option.icon : undefined}
                key={option.value}
                label={option.label ?? ''}
                labelStyle={option.labelStyle}
                left={option.left}
                onPress={() => {
                  props.onSelect(option.value);
                  setSheetVisible(false);
                }}
                right={!option.hideRight ? option.right : null}
                selected={option.value === props.value}
                style={option.style}
              />
            );
          })}
        </SheetModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.xs,
    marginHorizontal: theme.spacing.md,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
  },
  previewSection: {
    borderTopColor: theme.colors.gray.borderAlpha,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  separator: {
    marginVertical: theme.spacing.xs,
  },
});
