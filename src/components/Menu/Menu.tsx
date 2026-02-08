import { SFSymbol } from 'expo-symbols';
import { ReactElement } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { BrandIconName } from '../BrandIcon/BrandIcon';
import { FlashList, FlashListProps } from '../FlashList/FlashList';
import { RefreshControl } from '../RefreshControl/RefreshControl';
import { Text } from '../Text/Text';
import { MenuItem } from './MenuItem';

export type Item = MenuItem | string | null | (() => ReactElement);

export type Icon =
  | {
      color?: string;
      name: SFSymbol;
      type: 'symbol';
    }
  | {
      color?: string;
      name: string;
      type: 'icon';
    }
  | {
      color?: string;
      name: BrandIconName;
      type: 'brandIcon';
    };

export interface MenuItemOption {
  hideRight?: boolean;
  icon?: Icon;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  left?: ReactElement;
  right?: ReactElement;
  key?: string;
  style?: StyleProp<ViewStyle>;
  value: string;
}

export type MenuItem = {
  arrow?: boolean;
  description?: string;
  hideSelected?: boolean;
  icon?: Icon;
  image?: string;
  label: string;
  key?: string;
  labelStyle?: StyleProp<TextStyle>;
  onPress?: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
} & (
  | {
      type?: undefined;
    }
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
      key?: string;
      value: boolean;
    }
);

interface MenuProps {
  footer?: ReactElement;
  header?: ReactElement;
  items: Item[];
  listProps?: FlashListProps;
  onRefresh?: () => Promise<unknown>;
  style?: StyleProp<ViewStyle>;
}

export function Menu({
  items,
  footer,
  header,
  listProps,
  onRefresh,
}: MenuProps) {
  return (
    <FlashList
      {...listProps}
      contentInsetAdjustmentBehavior="automatic"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      data={items}
      keyExtractor={(_item, index) => String(index)}
      refreshControl={
        onRefresh ? <RefreshControl onRefresh={onRefresh} /> : undefined
      }
      // todo @luke-h1: move out of func body and create a lint rule for this
      renderItem={({ item }) => {
        if (item === null) {
          return <View style={menuStyles.menu} />;
        }

        if (typeof item === 'string') {
          return (
            <View style={menuStyles.sectionHeader}>
              <Text
                type="sm"
                weight="bold"
                color="gray.text"
                style={menuStyles.sectionTitle}
              >
                {item}
              </Text>
            </View>
          );
        }

        if (typeof item === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
          return item();
        }

        // @ts-expect-error fix me being unknown
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return <MenuItem item={item} style={item.style} />;
      }}
    />
  );
}

const menuStyles = StyleSheet.create(theme => ({
  menu: { height: theme.spacing.xs },
  sectionHeader: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
}));
