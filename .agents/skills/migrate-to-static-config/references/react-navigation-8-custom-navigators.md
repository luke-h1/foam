# Custom Navigators (React Navigation 8.x)

Use this file only when the codebase contains custom navigators built with `useNavigationBuilder` or `createNavigatorFactory`.

## Contents

- Check navigator factory types
- Static config usage
- Migration decision

## Check navigator factory types

A custom navigator uses the `useNavigationBuilder` hook. Before migration, ensure it uses same patterns for its types as official docs:

```tsx
import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  type StyleProp,
  type ViewStyle,
  StyleSheet,
} from 'react-native';
import {
  createNavigatorFactory,
  createScreenFactory,
  CommonActions,
  type DefaultNavigatorOptions,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  useNavigationBuilder,
  type NavigationProp,
} from '@react-navigation/native';

type MyNavigationConfig = {
  // Additional props accepted by the view
};

type MyNavigationOptions = {
  // Supported screen options
};

type MyNavigationEventMap = {
  // Map of event name and the type of data
};

// The type of the navigation object for each screen
type MyNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = NavigationProp<
  ParamList,
  RouteName,
  NavigatorID,
  TabNavigationState<ParamList>,
  MyNavigationOptions,
  MyNavigationEventMap
> &
  TabActionHelpers<ParamList>;

// The props accepted by the component is a combination of 3 things
type Props = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  TabNavigationState<ParamListBase>,
  MyNavigationOptions,
  MyNavigationEventMap,
  MyNavigationProp<ParamListBase>
> &
  TabRouterOptions &
  MyNavigationConfig;

function TabNavigator({ tabBarStyle, contentStyle, ...rest }: Props) {
  const { state, navigation, descriptors, NavigationContent } =
    useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      TabActionHelpers<ParamListBase>,
      MyNavigationOptions,
      MyNavigationEventMap
    >(TabRouter, rest);

  return (
    <NavigationContent>
      {/* Implementation of the navigator UI using state, navigation, and descriptors */}
    </NavigationContent>
  );
}

// Types required for type-checking the navigator
interface MyTabTypeBag extends NavigatorTypeBagBase {
  State: TabNavigationState<this['ParamList']>;
  ScreenOptions: MyNavigationOptions;
  EventMap: MyNavigationEventMap;
  ActionHelpers: TabActionHelpers<this['ParamList']>;
  Navigator: typeof TabNavigator;
}

// The factory function for creating the navigator
export const createMyNavigator =
  createNavigatorFactory<MyTabTypeBag>(TabNavigator);

// Helper for creating screen config with proper types for static configuration
export const createMyScreen = createScreenFactory<MyTabTypeBag>();
```

## Static config usage

Then, it can use the same static config API as official navigators:

```tsx
const MyNavigator = createMyNavigator({
  screens: {
    Home: HomeScreen,
    Profile: createMyScreen({
      screen: ProfileScreen,
      options: { title: 'My Profile' },
    }),
  },
});
```

## Migration decision

The actual implementation of the navigator is not relevant to the migration. The only relevant part is the navigator function (for example `createMyNavigator`) and whether it accepts a configuration object.

If it doesn't accept a config object, update it to use the `createNavigatorFactory` and navigator API patterns shown above before migration. If it already uses the same patterns, there are no changes needed to the navigator implementation for static config migration.
