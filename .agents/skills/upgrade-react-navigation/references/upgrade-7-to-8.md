# React Navigation 7.x to 8.x upgrade

## Goal

Upgrade React Navigation to 8.x and handle the required breaking changes.

## Minimum requirements

- Upgrade all `@react-navigation/*` packages together.
- Verify the official minimum versions and update if needed:
  - `react-native` `>= 0.83`
  - `expo` `>= 55` if the repo uses Expo
  - `typescript` `>= 6.0.0` if the repo uses TypeScript
  - `react-native-screens` `>= 4.25.0`
  - `react-native-safe-area-context` `>= 5.5.0`
  - `react-native-gesture-handler` `>= 3.0.0`
  - `react-native-reanimated` `>= 4.0.0`
  - `react-native-pager-view` `>= 8.0.0`
  - `react-native-web` `>= 0.21.0` if the app targets Web
- Install these required packages if not already present (versions above): `react-native-screens`, `react-native-safe-area-context`, and `@callstack/liquid-glass`.
- If the repo uses Expo, ensure development builds are used. Verify that either `expo-dev-client` is installed or the start workflow uses `expo start --dev-client`.
- If the repo uses TypeScript, set `moduleResolution: 'bundler'` and enable either `strict: true` or `strictNullChecks: true`.

## Official reference

Fetch [llms.txt](https://reactnavigation.org/llms-8.x.txt) for a list of documentation links. During the migration, refer to the official documentation for API reference for the latest React Navigation 8.x versions.

If custom navigators use built-in navigator views such as `StackView`, `BottomTabView` etc., check the actual implementation after the upgrade to verify the usage is still correct:

- `NativeStackView`: `node_modules/@react-navigation/native-stack/src/views/NativeStackView.tsx`
- `StackView`: `node_modules/@react-navigation/stack/src/views/Stack/StackView.tsx`
- `BottomTabView`: `node_modules/@react-navigation/bottom-tabs/src/views/BottomTabView.tsx`
- `DrawerView`: `node_modules/@react-navigation/drawer/src/views/DrawerView.tsx`
- `MaterialTopTabView`: `node_modules/@react-navigation/material-top-tabs/src/views/MaterialTopTabView.tsx`

## Required migration steps

### 1. Rework the TypeScript setup

#### Augment `RootNavigator` instead of `RootParamList`

Replace global `RootParamList` registration with module augmentation of `@react-navigation/native`.

Before:

```tsx
type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

After:

```tsx
type RootStackType = typeof RootStack;

declare module '@react-navigation/native' {
  interface RootNavigator extends RootStackType {}
}
```

#### Pass the navigator type to `NavigatorScreenParams`

When a hand-written param list nests another navigator, pass that navigator's type to `NavigatorScreenParams` instead of its param list.

Before:

```tsx
Feed: NavigatorScreenParams<FeedStackParamList>;
```

After:

```tsx
Feed: NavigatorScreenParams<typeof FeedStack>;
```

Here, `FeedStack` is the navigator object returned by `createXNavigator()`. Use `import type` to import the navigator type if it is defined in another module.

#### Pass a screen name to common hooks instead of a generic

`useNavigation`, `useRoute`, and `useNavigationState` no longer accept a type generic. Pass the screen name instead to get the types for that screen. This is the same for static and dynamic config:

```tsx
const navigation = useNavigation('Profile');
const route = useRoute('Profile');
const focusedRouteName = useNavigationState(
  'Profile',
  (state) => state.routes[state.index].name,
);
```

Choosing the screen name:

- If the hook didn't use a generic previously, leave it as-is, don't add a screen name.
- If the hook used a generic, use the route name from that generic. e.g.:
  - `useNavigation<StackNavigationProp<MyStackParamList, 'Profile'>>()` becomes `useNavigation('Profile')`
  - `useRoute<RouteProp<MyStackParamList, 'Profile'>>()` becomes `useRoute('Profile')`
  - `useNavigationState<MyStackParamList, 'Profile'>(...)` becomes `useNavigationState('Profile', ...)`
- If the generic doesn't have a route name, use the name of the screen where the component is rendered

#### Wrap object-form static screen configs with `createXScreen`

A screen written in the shorthand form (the component assigned directly) can stay as-is.

Wrap an object-form screen config with the `createXScreen` helper matching its navigator — `createNativeStackScreen`, `createStackScreen`, `createBottomTabScreen`, `createDrawerScreen`, etc.:

```tsx
const Stack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Profile: createNativeStackScreen({
      screen: ProfileScreen,
      options: ({ route }) => ({
        title: `User ${route.params.userId}`,
      }),
    }),
  },
});
```

#### Update custom navigator types

If the repo defines a custom navigator, update its `createNavigatorFactory` call and any local navigator wrapper typings. Define the type bag as an exported interface extending `NavigatorTypeBagBase` (use `this['ParamList']` for self-reference, and the new `ActionHelpers` field for action helpers like `TabActionHelpers`), then pass it as a type parameter to `createNavigatorFactory`. Add a `createXScreen` helper for static screen configs using the new `createScreenFactory`.

The updated shape should look like this:

```tsx
import {
  createNavigatorFactory,
  createScreenFactory,
  type DefaultNavigatorOptions,
  type NavigationProp,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  useNavigationBuilder,
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
> = NavigationProp<
  ParamList,
  RouteName,
  TabNavigationState<ParamList>,
  MyNavigationOptions,
  MyNavigationEventMap,
  TabActionHelpers<ParamList>
>;

type Props = DefaultNavigatorOptions<
  ParamListBase,
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
export interface MyTabTypeBag extends NavigatorTypeBagBase {
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

The `NavigatorID` type parameter and `id` prop are no longer supported and need to be removed.

The `describe` function no longer exists in the return type of `useNavigationBuilder`, so if the navigator used that for typing the descriptors, update it to use `descriptors[route.key].options` instead.

### 2. Update navigator behavior and option APIs

#### Update bottom tabs for the native default

Native bottom tabs replace the JavaScript implementation on iOS and Android, and `@react-navigation/bottom-tabs/unstable` is removed — import bottom tabs from `@react-navigation/bottom-tabs`.

Add `implementation: 'custom'` if the existing setup uses an API native tabs don't support. Read the types for the navigator and their JSDoc to see which options only work with the custom implementation.

```tsx
// Dynamic
<Tab.Navigator implementation="custom">
```

```tsx
// Static
createBottomTabNavigator({
  implementation: 'custom',
  screens: {
    // ...
  },
});
```

Update the related bottom-tab APIs:

- `tabBarShowLabel` becomes `tabBarLabelVisibilityMode` (`'auto'`, `'selected'`, `'labeled'`, `'unlabeled'`); replace `tabBarShowLabel: false` with `'unlabeled'`
- `tabBarLabel` now only accepts a `string`
- If `tabBarIcon` previously used an image asset and the app stays on native tabs, pass `{ type: 'image', source: ... }`
- `safeAreaInsets` on the navigator is removed
- `insets` and `layout` are removed from custom tab bar props

If a custom tab bar previously used the removed `insets` or `layout` props, replace them with `useSafeAreaInsets` and `useSafeAreaFrame` from `react-native-safe-area-context`.

#### Add `headerShown: true` to restore bottom tab headers

To preserve the previous behavior, add `headerShown: true`:

```tsx
<Tab.Navigator
  screenOptions={{
    headerShown: true,
  }}
>
```

#### Remove navigator `id` props and rewrite `getParent(id)`

Remove the `id` prop, and replace `navigation.getParent(id)` with the name of the screen parent to the component, rendered in the navigator which had that `id`.

For example, a `Tab.Navigator` with `id="RootTabs"` renders `Profile` screen that contains the component in a child:

Before:

```tsx
<Tab.Navigator id="RootTabs">
```

```tsx
const parent = navigation.getParent('RootTabs');
```

After:

```tsx
<Tab.Navigator>
```

```tsx
const parent = navigation.getParent('Profile');
```

#### Pass `navigate` arguments separately instead of an object

Pass the screen name, params, and options as separate arguments instead of a single object.

Before:

```tsx
navigation.navigate({ name: 'Profile', params: { userId: 123 }, merge: true });
```

After:

```tsx
navigation.navigate('Profile', { userId: 123 }, { merge: true });
```

If it previously used a route object, pass its fields as separate arguments.

Before:

```tsx
navigation.navigate(route);
```

After:

```tsx
navigation.navigate(route.name, route.params);
```

To navigate with a custom `path`, use `dispatch` with a `NAVIGATE` action:

```tsx
navigation.dispatch({
  type: 'NAVIGATE',
  payload: { name: 'Profile', params: { userId: 123 }, path: '/users/123' },
});
```

#### Replace `setParams` with `pushParams` where a history entry is needed

For screens inside tab or drawer navigators using `backBehavior="fullHistory"`, replace `setParams` with `pushParams` only at call sites that need to keep adding a new history entry. Do not replace `setParams` elsewhere.

Before:

```tsx
navigation.setParams({ filter: 'new' });
```

After:

```tsx
navigation.pushParams({ filter: 'new' });
```

#### Update code that reads preloaded or focused routes

`state.preloadedRoutes` is removed. `state.routes` now contains both active and preloaded routes, with preloaded routes at `state.routes.slice(state.index + 1)`.

Update code that reads the focused route from the end of the array, or that reads `state.preloadedRoutes` directly (e.g. in `useNavigationState`).

Before:

```tsx
const focused = state.routes[state.routes.length - 1];
const preloaded = state.preloadedRoutes;
```

After:

```tsx
const focused = state.routes[state.index];
const preloaded = state.routes.slice(state.index + 1);
```

#### Replace `InteractionManager` with `transitionEnd` events

Replace `InteractionManager.runAfterInteractions` with navigator transition events:

Before:

```tsx
InteractionManager.runAfterInteractions(() => {
  loadData();
});
```

After:

```tsx
navigation.addListener('transitionEnd', () => {
  loadData();
});
```

#### Widen manual color annotations to `ColorValue`

If the repo manually annotates React Navigation icon props, header props, or navigation theme colors as `string`, update those annotations to allow `ColorValue`.

#### Replace removed layout-related props with `useFrameSize`

Check these cases:

- `layout` on `Header` (both `@react-navigation/elements` and stack)
- `titleLayout`, `screenLayout`, and `onLabelLayout` on `HeaderBackButton`
- `layouts.title` and `layouts.leftLabel` in stack `headerStyleInterpolator`
- `layout` on bottom tab bar props
- `layout` and `initialLayout` in `react-native-tab-view`
- `layout` in `react-native-drawer-layout`

If removed layout-related props were previously used to read header or screen dimensions, replace that usage with `useFrameSize` from `@react-navigation/elements`. Its selector receives `{ width: number; height: number }`:

```tsx
const width = useFrameSize((size) => size.width);
```

#### Remove `detachInactiveScreens` and `freezeOnBlur`

Remove these options:

- `detachInactiveScreens`
- `detachPreviousScreen`
- `freezeOnBlur`

Where `freezeOnBlur` was set to `false`, replace it with `inactiveBehavior: 'none'`.

#### Rename and remove the affected navigator options

Apply these direct updates:

- `headerSearchBarOptions.onChangeText` becomes `onChange`
- `headerBackImage` and `headerBackImageSource` become `headerBackIcon`; custom rendered elements are not supported — convert an `Image` to the `{ type: 'image', source }` form
- `headerLargeTitle` becomes `headerLargeTitleEnabled`
- `gestureResponseDistance` in stack now takes a `number` instead of `{ horizontal, vertical }` — use the value matching `gestureDirection` if it's set, the `vertical` value for modal presentation, otherwise the `horizontal` value
- `overlayColor` in drawer becomes `overlayStyle`

Examples:

```tsx
headerSearchBarOptions: {
  onChange: (event) => {
    const text = event.nativeEvent.text;
  },
}
```

```tsx
headerBackIcon: {
  type: 'image',
  source: require('./back.png'),
}
```

```tsx
gestureResponseDistance: 50;
```

```tsx
overlayStyle: {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}
```

Remove these native stack options:

- `navigationBarColor`
- `navigationBarTranslucent`
- `statusBarBackgroundColor`
- `statusBarTranslucent`

#### Update Material Top Tabs and `react-native-tab-view` for Material Design 3

The default is now the Material Design 3 primary tab bar variant. To keep the previous look, set the secondary variant.

For Material Top Tabs Navigator:

```tsx
<Tab.Navigator
  screenOptions={{
    tabBarVariant: 'secondary',
  }}
>
```

For `react-native-tab-view`:

```tsx
<TabBar variant="secondary" {...props} />
```

Update custom indicator and tab item code:

- `renderIndicator`, `tabBarIndicator`, and `TabBarIndicator` no longer receive `width`, `getTabWidth`, `gap`, or `children`
- indicator props now include `variant`, `widths`, and `offsets`
- `renderTabBarItem` and `TabBarItem` no longer receive `onLayout` or `defaultTabWidth`
- tab item props now include `variant`, `onMeasureLayout`, and `onMeasureLabelLayout`
- custom tab bar items must call `onMeasureLayout` and `onMeasureLabelLayout` so the indicator can measure correctly

A custom tab bar item reports its own size and its label's size:

```tsx
<View
  onLayout={(e) => {
    const { width, height } = e.nativeEvent.layout;
    onMeasureLayout({ width, height });
  }}
>
  <View
    onLayout={(e) => {
      const { width, height } = e.nativeEvent.layout;
      onMeasureLabelLayout({ width, height });
    }}
  >
    {/* label */}
  </View>
</View>
```

### 3. Update linking and static navigation config

#### Set `enabled` explicitly in static linking config

This applies only to static `Navigation`, not dynamic `NavigationContainer`.

- If static `Navigation` previously had no `linking` prop, add `linking={{ enabled: false }}`
- If static `Navigation` previously had a `linking` prop without `enabled`, add `enabled: true`

#### Rename `UNSTABLE_router` and `UNSTABLE_routeNamesChangeBehavior`

- Rename `UNSTABLE_routeNamesChangeBehavior` to `routeNamesChangeBehavior`
- If the repo uses `UNSTABLE_router`, rename it to `router` without changing the implementation

### 4. Remove deprecated APIs and public exports

If these deprecated APIs are present, update or remove them:

- Replace `navigateDeprecated(ScreenName, params)` with `navigate(ScreenName, params, { pop: true })`
- The removed `navigation.getId()` method has no direct replacement; remove the usage and rework the surrounding logic to use screen names or route params instead of navigator ids
- Remove `navigationInChildEnabled` only after migrating navigation actions so they start from a screen in the current or parent navigator

#### Replace removed core APIs

Replace:

- `createComponentForStaticNavigation` with the static navigator's `getComponent()` method

Remove usage of:

- `CurrentRenderContext`
- `StaticConfigGroup`
- `StaticConfigScreens`

#### Pass `icon` to `HeaderBackButton` and `DrawerToggleButton`

Before:

```tsx
<HeaderBackButton backImage={require('./back.png')} />
<DrawerToggleButton imageSource={require('./menu.png')} />
```

After:

```tsx
<HeaderBackButton icon={{ type: 'image', source: require('./back.png') }} />
<DrawerToggleButton icon={{ type: 'image', source: require('./menu.png') }} />
```

#### Replace removed `@react-navigation/elements` exports

Replace:

- `Background` with `useTheme` plus a normal `View`
- `Screen` with the public components or plain `View` structure that renders the same UI. If it was only being used to render a header, render `Header` directly instead
- `SafeAreaProviderCompat` with `SafeAreaProvider` from `react-native-safe-area-context`
- `Lazy` and `ResourceSavingView` with local copied implementations only if the behavior is still needed
- `MissingIcon` with local placeholder icon code
- `Assets` by removing the preloading code

Some of these exports are still available from `@react-navigation/elements/internal` as an unstable escape hatch if a direct replacement is not feasible.

#### Rename `Header`'s `backImage` to `icon`

If the repo renders `Header` directly, rename its `backImage` prop to `icon` (removed layout-related props are listed above).

#### Pass an object to `getDefaultHeaderHeight`

Before:

```tsx
getDefaultHeaderHeight(layout, false, statusBarHeight);
```

After:

```tsx
getDefaultHeaderHeight({
  landscape: false,
  modalPresentation: false,
  topInset: statusBarHeight,
});
```

## Behavior changes to note

- Code previously deferred with `InteractionManager.runAfterInteractions` now runs from navigator `transitionEnd` events instead of the old global interaction queue behavior.
- Navigating to an existing route with the same screen `getId` value no longer moves that route instance to the top of the stack. If the previous flow relied on going back to the existing route instead of pushing a new one, it now needs `{ pop: true }`.
- Calling `preload()` for the same screen now updates that screen's params instead of creating a separate preloaded instance. If a flow relied on preloading multiple instances of the same screen, set the screen `getId` prop so each call with a different id creates a distinct preloaded instance.
- Previously, detach and freeze options could keep unfocused screens mounted or keep their effects alive. Now `inactiveBehavior: 'pause'` can clean up effects or background work when a screen becomes unfocused.
- Previously, native stack Android system bar options could customize or disable those bars through React Navigation. Now those options are removed, so apps must keep edge-to-edge enabled and handle system bars outside React Navigation.
- On Web, unfocused screens now use the `inert` attribute so they are non-interactive and hidden from assistive technologies without requiring `display: none`.
- Server rendering changed in a way that may require app-specific routing and metadata handling: `ServerContainer` moved to `@react-navigation/native/server`, its `location` prop now takes a `URL`, and it no longer accepts a `ref` or exposes `getCurrentOptions`.
- The default `linking.prefixes` is now `['*']`, which matches `http`, `https`, and custom schemes.

## Automated checks

- Required packages (`react-native-screens`, `react-native-safe-area-context`, and `@callstack/liquid-glass`) are installed and meet the minimum versions listed above.
- Other peer dependency entries meet the minimum versions when they are already present or required by the app's navigators, including `react-native-gesture-handler`, `react-native-reanimated`, `react-native-pager-view`, and `react-native-web`.
- Expo repos use a development-build workflow.
- TypeScript repos use `moduleResolution: 'bundler'` and either `strict: true` or `strictNullChecks: true`.
- Global `RootParamList` registration is replaced with `RootNavigator` module augmentation.
- `useNavigation`, `useRoute`, and `useNavigationState` no longer use hook generics.
- `NavigatorScreenParams` for a nested navigator uses the navigator type.
- Object-form static screen configs use the matching `createXScreen` helper.
- Navigator `id` props are removed, `navigation.getParent(id)` is rewritten, and the removed `navigation.getId()` method is no longer used.
- `navigation.navigate` is called with separate arguments instead of the removed object form.
- Static `Navigation` linking config sets explicit `enabled` values where needed to preserve the previous behavior.
- Removed APIs and props are gone, including `@react-navigation/bottom-tabs/unstable`, `navigateDeprecated`, `navigationInChildEnabled`, `headerBackImage`, `headerBackImageSource`, `imageSource`, `detachInactiveScreens`, `detachPreviousScreen`, `freezeOnBlur`, `navigationBarColor`, `navigationBarTranslucent`, `statusBarBackgroundColor`, `statusBarTranslucent`, `UNSTABLE_router`, and `UNSTABLE_routeNamesChangeBehavior`.
- Material Top Tabs and direct `react-native-tab-view` usage have been updated for `tabBarVariant`, `TabBar` `variant`, custom indicator props, custom tab item measurement props, and removed `initialLayout`.
- Removed `@react-navigation/elements` exports are fully replaced.
- Removed `createComponentForStaticNavigation`, `CurrentRenderContext`, `StaticConfigGroup`, and `StaticConfigScreens` are no longer used.

## Manual checks

- Do a full UI check across the app’s navigators.
- Verify deep links manually.
- On iOS, verify the app’s styling and navigation UI on both iOS 18 and iOS 26.
- If the app supports Web, verify focus management and keyboard navigation.
