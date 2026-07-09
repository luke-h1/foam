# React Navigation 6.x to 7.x upgrade

## Goal

Upgrade React Navigation to 7.x and handle the required breaking changes.

## Minimum requirements

- Upgrade all `@react-navigation/*` packages together.
- Verify the official minimum versions:
  - `react-native` `>= 0.72.0`
  - `expo` `>= 52` if the repo uses Expo Go
  - `typescript` `>= 5.0.0` if the repo uses TypeScript
- Install or update `react-native-screens` to `4.x`.
- If the repo uses `@react-navigation/drawer` on native, install or update `react-native-reanimated` to `3.x` and remove `useLegacyImplementation`.
- If the repo uses TypeScript, set `moduleResolution: 'bundler'` and enable either `strict: true` or `strictNullChecks: true`.
- If the repo uses Webpack, set `resolve.fullySpecified = false`.
- Stop importing internal package files such as `@react-navigation/.../src` or `@react-navigation/.../lib`. If the repo patches React Navigation packages, patch the built files under `lib/`.

## Official reference

Fetch [llms.txt](https://reactnavigation.org/llms.txt) for a list of documentation links. During the migration, refer to the official documentation for API reference for the latest React Navigation 7.x versions.

## Required migration steps

### 1. Fix `navigate` call sites

#### Navigate to nested child screens explicitly

In 6.x, `navigation.navigate('Details')` could jump to a screen inside an already mounted child navigator. In 7.x, make the parent navigator explicit.

Before:

```tsx
navigation.navigate('Details');
```

After:

```tsx
navigation.navigate('Home', {
  screen: 'Details',
});
```

Use the actual parent screen name, and keep the child screen params nested under `params`.

Rewrite child-screen navigation call sites so actions start from a screen in the current or parent navigator. Do not add `navigationInChildEnabled`.

#### Add `{ pop: true }` to same-stack `navigate` calls

`navigate` no longer goes back to an existing earlier screen in the same stack. For calls that navigate to another screen in the same stack navigator, add `{ pop: true }` to preserve the previous behavior.

Before:

```tsx
navigation.navigate('PreviousScreen', { foo: 42 });
```

After:

```tsx
navigation.navigate('PreviousScreen', { foo: 42 }, { pop: true });
```

#### Replace `navigate({ key })` with `getId` and a screen name

If the app navigates by route key, define `getId` on the target screen and rewrite the call site to navigate by screen name plus the params that identify that route instance.

Before:

```tsx
navigation.navigate({
  key: 'profile-123',
  name: 'Profile',
  params: { id: '123' },
});
```

After:

```tsx
<Stack.Screen
  name="Profile"
  component={ProfileScreen}
  getId={({ params }) => params.id}
/>

navigation.navigate('Profile', { id: '123' });
```

### 2. Update `NavigationContainer` and theme usage

- `independent` on `NavigationContainer` is removed. Wrap the container in `NavigationIndependentTree` instead.
- Custom theme objects must include the `fonts` property.
- Navigation state is frozen in development mode. If the app mutates navigation state or route objects directly, refactor to use navigation actions or immutable updates instead.

When replacing `independent`, move the isolation boundary outside the container:

```tsx
import { DefaultTheme, NavigationIndependentTree } from '@react-navigation/native';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // my stuff
  },
};

<NavigationIndependentTree>
  <NavigationContainer theme={MyTheme}>{/* ... */}</NavigationContainer>
</NavigationIndependentTree>
```

### 3. Update linking APIs

#### Rewrite `Link`/`useLinkProps` `to` as `screen` and `params`

The `to` prop is removed. Rewrite `to` to `screen` and `params`, deriving them from the existing linking configuration.

Before:

```tsx
<Link to="/details?foo=42">Go to Details</Link>
const props = useLinkProps({ to: '/details?foo=42' });
```

After:

```tsx
<Link screen="Details" params={{ foo: 42 }}>Go to Details</Link>
const props = useLinkProps({ screen: 'Details', params: { foo: 42 } });
```

#### Destructure the object returned by `useLinkBuilder`

If the repo builds custom navigators or custom link helpers, update:

```tsx
const buildHref = useLinkBuilder();
```

to:

```tsx
const { buildHref, buildAction } = useLinkBuilder();
```

### 4. Update navigator and element APIs

#### Stack and native stack

- `headerBackTitleVisible` becomes `headerBackButtonDisplayMode` (`true` -> `default`, `false` -> `minimal`).
- `headerTruncatedBackTitle` becomes `headerBackTruncatedTitle`.
- `animationEnabled: false` becomes `animation: 'none'` in stack.
- `customAnimationOnGesture` becomes `animationMatchesGesture` in native stack.
- `statusBarColor` becomes `statusBarBackgroundColor` in native stack.

#### Tabs and drawer

- `unmountOnBlur` is removed from bottom tabs and drawer.
- `tabBarTestID` becomes `tabBarButtonTestID` in bottom tabs and material top tabs.
- `sceneContainerStyle` navigator prop becomes the `sceneStyle` screen option in bottom tabs, material top tabs, and drawer.
- Drawer no longer supports `useLegacyImplementation`.
- `@react-navigation/material-top-tabs` no longer requires a separate `react-native-tab-view` install if that package is only used through the navigator.

To preserve the old `unmountOnBlur` behavior, wrap the affected screen content with `UnmountOnBlur`:

```tsx
import { useIsFocused } from '@react-navigation/native';

function UnmountOnBlur({ children }: { children: React.ReactNode }) {
  const isFocused = useIsFocused();

  if (!isFocused) {
    return null;
  }

  return children;
}
```

For a screen that previously set `unmountOnBlur`, add `UnmountOnBlur` through its `layout`:

```tsx
<Tab.Screen
  name="Feed"
  component={Feed}
  layout={({ children }) => <UnmountOnBlur>{children}</UnmountOnBlur>}
/>
```

For a navigator that previously set `unmountOnBlur`, add it through `screenLayout`:

```tsx
<Tab.Navigator
  screenLayout={({ children }) => <UnmountOnBlur>{children}</UnmountOnBlur>}
>
```

#### Header elements

- `headerBackTitleVisible` becomes `headerBackButtonDisplayMode`
  - `true` -> `default`
  - `false` -> `minimal`
- `headerTruncatedBackTitle` becomes `headerBackTruncatedTitle`
- `labelVisible` is removed from `headerLeft` and `HeaderBackButton`. Use `displayMode` instead:
  - show the normal label -> `default`
  - show the generic back label -> `generic`
  - hide the label -> `minimal`

#### Migrate direct `react-native-tab-view` usage

If the repo uses `react-native-tab-view` directly, move its `TabBar` and route option props to the new `commonOptions` / `options` API, and replace `sceneContainerStyle` with `sceneStyle`:

- `getLabelText` -> `labelText`
- `getAccessible` -> `accessible`
- `getAccessibilityLabel` -> `accessibilityLabel`
- `getTestID` -> `testID`
- `renderIcon` -> `icon`
- `renderLabel` -> `label`
- `renderBadge` -> `badge`

#### Update custom navigator types

If the repo defines a custom navigator, update its `createNavigatorFactory` wrapper and typings for the fuller type information 7.x requires. Define a `TypeBag` type for the navigator, make the factory a generic function over `ParamList`, `NavigatorID`, `TypeBag`, and `Config` that returns a `TypedNavigator`, and add a `createXScreen` helper with `createScreenFactory` for static screen configs.

The updated 7.x shape should look like this:

```tsx
import {
  createNavigatorFactory,
  createScreenFactory,
  type DefaultNavigatorOptions,
  type NavigationProp,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StaticConfig,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  type TypedNavigator,
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
export type MyNavigationProp<
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

// Type bag used for type-checking the navigator
export type MyTabTypeBag<
  ParamList extends ParamListBase = ParamListBase,
  NavigatorID extends string | undefined = string | undefined,
> = {
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
};

// The factory function for creating the navigator
export function createMyNavigator<
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = string | undefined,
  const TypeBag extends NavigatorTypeBagBase = MyTabTypeBag<
    ParamList,
    NavigatorID
  >,
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
  return createNavigatorFactory(TabNavigator)(config);
}

// Helper for creating screen config with proper types for static configuration
export const createMyScreen = createScreenFactory<MyTabTypeBag>();
```

### 5. Remove deprecated 6.x APIs and handle package moves

#### `@react-navigation/stack`

- `mode` prop is removed. Use `presentation` instead with the same value (`'card'` or `'modal'`).
- `headerMode` navigator prop is removed. Use the `headerMode` screen option (`'float'` or `'screen'`) instead, and replace `headerMode="none"` with `headerShown: false`.
- `keyboardHandlingEnabled` navigator prop is removed. Use the screen option instead.

#### `@react-navigation/drawer`

- `openByDefault` becomes `defaultStatus`.
- Navigator-level `lazy` becomes the `lazy` screen option.
- `drawerContentOptions` is removed. Map the old keys directly:
  - `drawerPosition` -> `drawerPosition`
  - `drawerType` -> `drawerType`
  - `edgeWidth` -> `swipeEdgeWidth`
  - `hideStatusBar` -> `drawerHideStatusBarOnOpen`
  - `keyboardDismissMode` -> `keyboardDismissMode`
  - `minSwipeDistance` -> `swipeMinDistance`
  - `overlayColor` -> `overlayColor`
  - `statusBarAnimation` -> `drawerStatusBarAnimation`
  - `gestureHandlerProps` -> `configureGestureHandler`

#### `@react-navigation/bottom-tabs`

- Navigator-level `lazy` becomes the `lazy` screen option.
- `tabBarOptions` is removed. Map the old keys directly:
  - `keyboardHidesTabBar` -> `tabBarHideOnKeyboard`
  - `activeTintColor` -> `tabBarActiveTintColor`
  - `inactiveTintColor` -> `tabBarInactiveTintColor`
  - `activeBackgroundColor` -> `tabBarActiveBackgroundColor`
  - `inactiveBackgroundColor` -> `tabBarInactiveBackgroundColor`
  - `allowFontScaling` -> `tabBarAllowFontScaling`
  - `showLabel` -> `tabBarShowLabel`
  - `labelStyle` -> `tabBarLabelStyle`
  - `iconStyle` -> `tabBarIconStyle`
  - `tabStyle` -> `tabBarItemStyle`
  - `labelPosition` and `adaptive` -> `tabBarLabelPosition`
- `tabBarVisible` is removed. Hide the bar with `tabBarStyle: { display: 'none' }`.

#### `@react-navigation/material-top-tabs`

- Navigator-level `swipeEnabled`, `lazy`, `lazyPlaceholder`, and `lazyPreloadDistance` become options instead of navigator props.
- `tabBarOptions` is removed. Map the old keys directly:
  - `renderBadge` -> `tabBarBadge`
  - `renderIndicator` -> `tabBarIndicator`
  - `activeTintColor` -> `tabBarActiveTintColor`
  - `inactiveTintColor` -> `tabBarInactiveTintColor`
  - `pressColor` -> `tabBarPressColor`
  - `pressOpacity` -> `tabBarPressOpacity`
  - `showLabel` -> `tabBarShowLabel`
  - `showIcon` -> `tabBarShowIcon`
  - `allowFontScaling` -> `tabBarAllowFontScaling`
  - `bounces` -> `tabBarBounces`
  - `scrollEnabled` -> `tabBarScrollEnabled`
  - `iconStyle` -> `tabBarIconStyle`
  - `labelStyle` -> `tabBarLabelStyle`
  - `tabStyle` -> `tabBarItemStyle`
  - `indicatorStyle` -> `tabBarIndicatorStyle`
  - `indicatorContainerStyle` -> `tabBarIndicatorContainerStyle`
  - `contentContainerStyle` -> `tabBarContentContainerStyle`
  - `style` -> `tabBarStyle`

#### Package moves and related tooling

- If the repo uses `@react-navigation/material-bottom-tabs`, migrate its imports and package usage to `react-native-paper/react-navigation`:

```tsx
// Before
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
// After
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';
```
- Ensure `react-native-paper` `>= 5.15.0` is installed where that navigator is added.
- If the repo used the removed Flipper plugin from `@react-navigation/devtools`, migrate it to `useLogger`.

## Behavior changes to note

- Previously, `onReady` could fire before a navigator was actually rendered. Now it fires only after a navigator is rendered, so apps that conditionally render navigators inside `NavigationContainer` may see it fire later.
- Previously, path params were encoded more aggressively with behavior closer to `encodeURIComponent`. Now only characters that are invalid in the path position are encoded, so deep links containing reserved characters such as `@` can resolve differently.
- Previously, screens pushed on top of modals could still render as normal cards. Now those screens inherit modal presentation. Set `presentation: 'card'` on those screens to keep the card appearance.
- Headers, drawer, and material top tabs now use Material Design 3 styling by default.
- If the repo used the removed Flipper plugin, navigation debugging now comes from `useLogger` instead of Flipper.

## Automated checks

- Required package versions are installed, including `react-native-screens` `4.x` and `react-native-reanimated` `3.x` where drawer is used.
- TypeScript repos use `moduleResolution: 'bundler'` and either `strict: true` or `strictNullChecks: true`.
- `NavigationContainer` no longer uses `independent`, and any isolated tree uses `NavigationIndependentTree`.
- Custom themes include the `fonts` property.
- No child-screen navigation relies on implicit lookup, and `navigationInChildEnabled` is not added or left behind.
- Same-stack `navigate('Screen', ...)` call sites use `{ pop: true }` to preserve the previous behavior.
- `navigate({ key })` is removed. Matching screens define `getId`, and the call sites navigate by name plus identifying params instead of route keys.
- `Link` and `useLinkProps` no longer use `to`.
- `useLinkBuilder` is updated to return `{ buildHref, buildAction }`.
- Removed props and APIs are gone, including `useLegacyImplementation`, `unmountOnBlur`, `headerBackTitleVisible`, `headerTruncatedBackTitle`, `animationEnabled`, `customAnimationOnGesture`, `statusBarColor`, `tabBarTestID`, and `sceneContainerStyle`.
- Material bottom tabs imports are migrated if the repo uses that package.
- Internal React Navigation package imports are removed.

## Manual checks

- Do a full UI check across the app’s navigators.
- Verify deep links manually.
