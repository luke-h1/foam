/* eslint-disable no-nested-ternary */
import { theme } from '@app/styles/themes';
import { Picker } from '@react-native-picker/picker';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle, StyleSheet } from 'react-native';
// eslint-disable-next-line no-restricted-imports
import { Pressable } from 'react-native';
import { BrandIcon } from '../BrandIcon/BrandIcon';
import { Icon } from '../Icon/Icon';
import { Image } from '../Image/Image';
import { Switch } from '../Switch/Switch';
import { Text } from '../Text/Text';
import {
  type Icon as IconType,
  type MenuItem,
  type MenuItemOption,
} from './Menu';

interface MenuItemProps {
  item: MenuItem;
  style?: StyleProp<ViewStyle>;
}

function renderIcon(icon: IconType, defaultColor: string) {
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

export function MenuItem({ item, style }: MenuItemProps) {
  const selected = useMemo(() => {
    if (item.type === 'options') {
      const $selected = item.options
        .filter(isMenuItemOption)
        .find(option => option?.value === item.value);

      return $selected?.right ?? $selected?.label ?? $selected?.value;
    }

    return null;
  }, [item]);

  const content = (
    <View style={styles.component}>
      {item.icon ? renderIcon(item.icon, theme.colors.gray.border) : null}

      {!item.icon && item.image && (
        <Image source={item.image} style={styles.image} />
      )}

      <View style={styles.contentContainer}>
        <Text weight="semibold">{item.label}</Text>

        {item.description ? (
          <Text type="xs" color="gray.textLow">
            {item.description}
          </Text>
        ) : null}
      </View>

      {item.hideSelected ? null : typeof selected === 'string' ? (
        <Text color="gray" weight="bold">
          {selected}
        </Text>
      ) : (
        selected
      )}

      {item.type === 'switch' ? (
        <Switch
          onValueChange={value => {
            item.onSelect(value);
          }}
          value={item.value}
        />
      ) : null}

      {item.arrow ? <Icon color="gray" icon="arrow-right" /> : null}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {item.type === 'switch' || item.type === 'options' ? (
        content
      ) : (
        <Pressable
          onPress={() => {
            if (typeof item.onPress === 'function') {
              void item.onPress();
            }
          }}
        >
          {content}
        </Pressable>
      )}

      {item.type === 'options' ? (
        <View style={[styles.section, styles.pickerSection]}>
          <Picker
            dropdownIconColor={theme.colors.gray.text}
            itemStyle={styles.pickerItem}
            selectedValue={item.value}
            style={styles.picker}
            testID="menu-item-picker"
            onValueChange={value => {
              item.onSelect(String(value));
            }}
          >
            {item.options.filter(isMenuItemOption).map(option => (
              <Picker.Item
                key={option.value}
                label={option.label ?? option.value}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      ) : null}

      {item.preview ? <View style={styles.section}>{item.preview}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  component: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
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
  image: {
    height: 20,
    width: 20,
  },
  picker: {
    color: theme.colors.gray.text,
    marginHorizontal: -theme.spacing.md,
  },
  pickerItem: {
    color: theme.colors.gray.text,
  },
  pickerSection: {
    paddingTop: theme.spacing.xs,
  },
  section: {
    borderTopColor: theme.colors.gray.borderAlpha,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
});
