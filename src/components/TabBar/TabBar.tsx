import {
  IconSymbol,
  IconSymbolName,
} from '@app/components/IconSymbol/IconSymbol';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/Text/Text';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const TAB_ICONS: Record<
  string,
  { default: IconSymbolName; focused: IconSymbolName }
> = {
  Following: { default: 'person.2', focused: 'person.2.fill' },
  Top: { default: 'chart.bar', focused: 'chart.bar.fill' },
  Search: { default: 'magnifyingglass', focused: 'magnifyingglass' },
  Settings: { default: 'gearshape', focused: 'gearshape.fill' },
};

function getIconName(label: string, isFocused: boolean): IconSymbolName {
  const icons = TAB_ICONS[label];
  if (!icons) {
    return 'circle';
  }
  return isFocused ? icons.focused : icons.default;
}

interface TabItemProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeTintColor: string;
  inactiveTintColor: string;
}

function TabItem({
  label,
  isFocused,
  onPress,
  onLongPress,
  activeTintColor,
  inactiveTintColor,
}: TabItemProps) {
  const color = isFocused ? activeTintColor : inactiveTintColor;
  const iconName = getIconName(label, isFocused);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <PressableArea
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      onPress={handlePress}
      onLongPress={onLongPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.tabItem}
    >
      <IconSymbol name={iconName} size={24} color={color} />
      <Text
        type="xxxs"
        weight={isFocused ? 'medium' : 'normal'}
        style={{ color }}
      >
        {label}
      </Text>
    </PressableArea>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const activeTintColor = theme.colors.grass.accent;
  const inactiveTintColor = theme.colors.gray.textLow;

  const content = (
    <View
      style={[styles.content, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const label =
          typeof descriptor?.options.tabBarLabel === 'string'
            ? descriptor.options.tabBarLabel
            : (descriptor?.options.title ?? route.name);

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            label={label}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            activeTintColor={activeTintColor}
            inactiveTintColor={inactiveTintColor}
          />
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint="systemChromeMaterial"
        intensity={80}
        style={styles.blurContainer}
      >
        {content}
      </BlurView>
    );
  }

  return <View style={styles.solidContainer}>{content}</View>;
}

const styles = StyleSheet.create(theme => ({
  blurContainer: {
    borderTopColor: theme.colors.gray.border,
    borderTopWidth: 0.5,
  },
  solidContainer: {
    backgroundColor: theme.colors.gray.bg,
    borderTopColor: theme.colors.gray.border,
    borderTopWidth: 0.5,
  },
  content: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    paddingVertical: 4,
  },
}));
