# Mixing Static and Dynamic APIs (React Navigation 7.x)

Use this file only as a fallback when full static migration is not possible.

Prefer a static root navigator. Once any part of the tree remains dynamic, automatic linking and automatic TypeScript types stop at that boundary. Handle linking and typing for the mixed boundary manually.

## Static root navigator, dynamic nested navigator

Use this fallback when a parent navigator can be migrated but a nested navigator cannot.

- Keep the parent navigator static
- Keep the dynamic navigator under a screen in the static parent navigator
- Define linking for the dynamic child screens manually in the parent screen's `linking.screens`
- Type the parent screen params with `StaticScreenProps<NavigatorScreenParams<...>>`

```tsx
type FeedParamList = {
  Latest: undefined;
  Popular: undefined;
};

type FeedScreenProps = StaticScreenProps<NavigatorScreenParams<FeedParamList>>;

function FeedScreen(_: FeedScreenProps) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Latest" component={LatestScreen} />
      <Tab.Screen name="Popular" component={PopularScreen} />
    </Tab.Navigator>
  );
}

const RootStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Feed: createNativeStackScreen({
      screen: FeedScreen,
      linking: {
        path: 'feed',
        screens: {
          Latest: 'latest',
          Popular: 'popular',
        },
      },
    }),
  },
});
```

## Dynamic root navigator, static nested navigator

Use this fallback only when a parent navigator cannot be migrated and must remain dynamic.

- Migrate the nested navigator to the static API
- Use `.getComponent()` on the static navigator to get a screen component for the dynamic parent
- Derive params with `StaticParamList<typeof StaticNavigator>` and use `NavigatorScreenParams<...>` in the dynamic parent's param list
- Generate linking config with `createPathConfigForStaticNavigation(StaticNavigator)` and place it in:
  - The `linking.config` of `NavigationContainer` if the parent dynamic navigator is the root navigator
  - The `linking.screens` of the screen in static grandparent navigator of the dynamic parent if the parent dynamic navigator is nested

```tsx
const FeedTabs = createBottomTabNavigator({
  screens: {
    Latest: LatestScreen,
    Popular: PopularScreen,
  },
});

const FeedScreen = FeedTabs.getComponent();

type FeedTabsParamList = StaticParamList<typeof FeedTabs>;

type RootStackParamList = {
  Home: undefined;
  Feed: NavigatorScreenParams<FeedTabsParamList>;
};

const feedScreens = createPathConfigForStaticNavigation(FeedTabs);

const linking = {
  prefixes: ['https://example.com', 'example://'],
  config: {
    screens: {
      Home: '',
      Feed: {
        path: 'feed',
        screens: feedScreens,
      },
    },
  },
};
```
