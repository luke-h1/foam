import { SFSymbol } from 'expo-symbols';
import { ReactElement } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { FlashList, FlashListProps } from '../FlashList';
import { IconName, IconWeight } from '../Icon';
import { RefreshControl } from '../RefreshControl';
import { Text } from '../Text';
import { MenuItem } from './MenuItem';

type Icon =
  | {
      color?: string;
      name: SFSymbol;
      type: 'symbol';
    }
  | {
      color?: string;
      name: IconName;
      type: 'icon';
      weight?: IconWeight;
    };

export interface MenuItemOption {
  hideRight?: boolean;
  icon?: string;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  left?: ReactElement;
  right?: ReactElement;
  style?: StyleProp<ViewStyle>;
  value: string;
}

export type MenuItem = {
  arrow?: boolean;
  description?: string;
  hideSelected?: boolean;
  icon?: Icon;
  label: string;
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
      value?: string;
    }
  | {
      onSelect: (value: boolean) => void;
      type: 'switch';
      value: boolean;
    }
);

interface MenuProps {
  footer?: ReactElement;
  header?: ReactElement;
  items: FlashList[];
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
  style,
}: MenuProps) {
  return (
    <FlashList
      {...listProps}
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      // contentContainerStyle={[styles.content, style]}
      data={items}
      // initialNumToRender={100}
      keyExtractor={(item, index) => String(index)}
      // ref={list}
      refreshControl={
        onRefresh ? <RefreshControl onRefresh={onRefresh} /> : undefined
      }
      renderItem={({ item }) => {
        if (typeof item === 'string') {
          return <Text>{item}</Text>;
        }

        if (typeof item === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
          return item();
        }

        return <MenuItem item={item} style={item.style} />;
      }}
    />
  );
}
