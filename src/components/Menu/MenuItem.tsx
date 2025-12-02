/* eslint-disable no-nested-ternary */
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
// eslint-disable-next-line no-restricted-imports
import { Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Switch } from '../Switch';
import { Typography } from '../Typography';
import { SheetItem } from '../sheets/SheetItem';
import { SheetModal } from '../sheets/SheetModal';
import { type MenuItem } from './Menu';

interface MenuItemProps {
  item: MenuItem;
  style?: StyleProp<ViewStyle>;
}

export function MenuItem({ item, style }: MenuItemProps) {
  const sheet = useRef<BottomSheetModal>(null);

  const Component = item.type === 'switch' ? View : Pressable;

  const selected = useMemo(() => {
    if (item.type === 'options') {
      const $selected = item.options
        .filter(option => typeof option === 'object')
        .find(option => option?.value === item.value);

      return $selected?.right ?? $selected?.value;
    }

    return null;
  }, [item]);

  const { theme } = useUnistyles();

  return (
    <>
      <Component
        onPress={() => {
          if (typeof item.onPress === 'function') {
            void item.onPress();
          }

          if (item.type === 'options') {
            sheet.current?.present();
          }
        }}
        style={[styles.component, style]}
      >
        {item.icon ? (
          item.icon.type === 'symbol' ? (
            <SymbolView
              name={item.icon.name}
              tintColor={item.icon.color ?? theme.colors.gray.border}
            />
          ) : (
            // <Icon icon={'} />
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <></>
          )
        ) : null}

        {!item.icon && item.image && (
          <Image source={item.image} style={styles.image} />
        )}

        <View style={styles.contentContainer}>
          <Typography fontWeight="bold">{item.label}</Typography>

          {item.description ? (
            <Typography color="gray" highContrast={false}>
              {item.description}
            </Typography>
          ) : null}
        </View>

        {item.hideSelected ? null : typeof selected === 'string' ? (
          <Typography color="gray" fontWeight="bold">
            {selected}
          </Typography>
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
      </Component>

      {item.type === 'options' ? (
        <SheetModal
          container={item.options.length > 6 ? 'scroll' : 'view'}
          ref={sheet}
          title={item.title ?? item.label}
        >
          {item.options.map((option, index) => {
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
                <Typography
                  highContrast={false}
                  key={option}
                  mb="sm"
                  mt="sm"
                  mx="sm"
                  size="md"
                  fontWeight="semiBold"
                >
                  {option}
                </Typography>
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
                  item.onSelect(option.value);

                  sheet.current?.dismiss();
                }}
                right={!option.hideRight ? option.right : null}
                selected={option.value === item.value}
                style={option.style}
              />
            );
          })}
        </SheetModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create(theme => ({
  component: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
  },
  separator: {
    marginVertical: theme.spacing.xs,
  },
  image: {
    width: 20,
    height: 20,
  },
}));
