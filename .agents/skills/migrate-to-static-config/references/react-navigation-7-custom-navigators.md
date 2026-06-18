# Custom Navigators (React Navigation 7.x)

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
  CommonActions,
  type DefaultNavigatorOptions,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StaticConfig,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  type TypedNavigator,
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
  /* implementation of the navigator */
}

// Types required for type-checking the navigator
type MyTabTypeBag<ParamList extends {}> = {
  ParamList: ParamList;
  State: TabNavigationState<ParamList>;
  ScreenOptions: MyNavigationOptions;
  EventMap: MyNavigationEventMap;
  NavigationList: {
    [RouteName in keyof ParamList]: MyNavigationProp<ParamList, RouteName>;
  };
  Navigator: typeof TabNavigator;
};

// The factory function with overloads for static and dynamic configuration
export function createMyNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TabNavigationState<ParamList>;
    ScreenOptions: MyNavigationOptions;
    EventMap: MyNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: MyNavigationProp<
        ParamList,
        RouteName,
        NavigatorID
      >;
    };
    Navigator: typeof TabNavigator;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(TabNavigator)(config);
}
```

## Static config usage

Then, it can use the same static config API as official navigators:

```tsx
const MyNavigator = createMyNavigator({
  screens: {
    Home: HomeScreen,
    Profile: {
      screen: ProfileScreen,
      options: { title: 'My Profile' },
    },
  },
});
```

## Migration decision

The actual implementation of the navigator is not relevant to the migration. The only relevant part is the navigator function (e.g. `createMyNavigator`) and whether it accepts configuration object.

If it doesn't accept a config object, update it to use the `createNavigatorFactory` and navigator API patterns shown above before migration. If it already uses the same patterns, there are no changes needed to the navigator implementation for static config migration.
