import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Icon } from '@app/components/Icon/Icon';
import {
  type Icon as MenuIcon,
  type MenuItemOption,
} from '@app/components/Menu/Menu';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { SheetItem } from '@app/components/sheets/SheetItem';
import { SheetModal } from '@app/components/sheets/SheetModal';
import { theme } from '@app/styles/themes';
import { SymbolView } from 'expo-symbols';
import { type ReactElement, type ReactNode, useMemo, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable, StyleSheet, View } from 'react-native';

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
  const { description, icon, label, preview, type } = props;
  const [sheetVisible, setSheetVisible] = useState(false);

  const selected = useMemo(() => {
    if (type !== 'options') return null;
    const { options, value } = props;
    const $selected = options
      .filter(isMenuItemOption)
      .find(option => option?.value === value);

    return $selected?.right ?? $selected?.label ?? $selected?.value;
  }, [props, type]);

  let switchControl: ReactNode = null;
  if (type === 'switch') {
    const { onSelect, value: switchValue } = props;
    switchControl = (
      <Switch
        onValueChange={v => {
          onSelect(v);
        }}
        value={switchValue}
      />
    );
  }

  const row = (
    <View style={styles.row}>
      {icon ? renderIcon(icon, theme.colors.gray.border) : null}

      <View style={styles.contentContainer}>
        <Text weight="semibold">{label}</Text>

        {description ? (
          <Text type="xs" color="gray.textLow">
            {description}
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

      {switchControl}
    </View>
  );

  let optionsSheet: ReactNode = null;
  if (type === 'options') {
    const { onSelect, options, title, value } = props;
    optionsSheet = (
      <SheetModal
        container={options.length > 6 ? 'scroll' : 'view'}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={title ?? label}
      >
        {options.map((option, index) => {
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
                onSelect(option.value);
                setSheetVisible(false);
              }}
              right={!option.hideRight ? option.right : null}
              selected={option.value === value}
              style={option.style}
            />
          );
        })}
      </SheetModal>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {type === 'options' ? (
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

        <View style={styles.previewSection}>{preview}</View>
      </View>

      {optionsSheet}
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
