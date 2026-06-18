# React Navigation 7.x Static Config Migration

Use this file only when `@react-navigation/native` is on `7.x`.

## Contents

- Prerequisites
- Official reference
- Structure
- Workflow
  - Identify static candidates
  - Identify custom navigators
  - Convert navigator JSX to static config
  - Replace `navigation` prop with `useNavigation`
  - Convert nested navigators
  - Convert groups
  - Convert auth flows
  - Use `.with()` for wrappers, providers, and dynamic navigator props
  - Migrate screen-level linking
  - Update types
  - Replace the root container
- Mixing Static and Dynamic APIs
- Limitations
- Review

## Prerequisites

- The project is using React Navigation 7.x.
- Before migrating any navigator, ensure `@react-navigation/*` packages in `package.json` are updated to the latest published 7.x version:
  - Run `npm view package-name@7 version` for each `@react-navigation` package in `package.json` to check the latest 7.x version, for example `npm view @react-navigation/native@7 version`.
  - If the versions are not up-to-date, stop and ask whether to update them.
  - Once confirmed, update the versions in `package.json` and install them.
  - Do not proceed with the migration unless versions are updated.

## Official reference

Fetch [llms.txt](https://reactnavigation.org/llms.txt) for a list of documentation links. During the migration, find the relevant link based on the topic and refer to the official docs when needed.

## Structure

1. Create a static navigator with `createXNavigator({ screens, groups, ... })`.
2. Each `screens` entry can be a component, a nested static navigator, or a screen config object.
3. `groups` define shared options and conditional rendering using `if`, and contain their own `screens`.
4. Screen config objects accept the same options as the dynamic `Screen` API, plus static-only additions such as `linking` and `if`.
5. When a screen needs a config object, use the navigator's screen helper such as `createNativeStackScreen` or `createBottomTabScreen`.
6. A screen config `linking` can be a string path or an object with `path`, `parse`, `stringify`, and `exact`.

## Workflow

### Identify static candidates

A navigator is a static candidate if all its screens are known at build time. Classify it before editing code:

- **Direct static migration**
  - A fixed set of `<Stack.Screen>`, `<Tabs.Screen>`, or similar screen elements declared explicitly in JSX
  - Nested navigators whose own screen lists are already static
  - Conditional screens or groups controlled by auth state, feature flags, or other boolean conditions
  - Navigator-level `screenOptions`, `initialRouteName`, and group options that do not depend on component-local props or hooks
  - Screen options, params, IDs, and linking config that are already known in module scope
- **Static migration with adaptation**
  - Render callbacks used only to pass extra props or wrappers to a screen
  - Navigators wrapped in providers or components that use hooks to compute navigator-level props
  - Factory functions that generate navigators from a fixed screen list or a fixed set of options
- **Keep dynamic**
  - Screen lists built from runtime data, such as mapping over API responses, server-driven config, or data not known statically
  - Dynamic properties on `<Screen>` except `options` and `listeners`, such as `initialParams` and `getId`
  - Navigation structure that depends on async data before the full route tree can be known
  - Child navigators whose parent navigator must stay dynamic and cannot represent the child as a static screen entry

"Keep dynamic" always takes precedence.

Start the migration from the root navigator and work downwards. If the root navigator is not a static candidate, abort the migration unless the user explicitly wants to keep the root dynamic and migrate only nested navigators.

### Identify custom navigators

If the codebase contains custom navigators (grep for `useNavigationBuilder` or `createNavigatorFactory`), read [`react-navigation-7-custom-navigators.md`](./react-navigation-7-custom-navigators.md) before continuing.

### Convert navigator JSX to static config

Convert the existing navigator first, then introduce screen config objects only where a screen needs options, listeners, params, IDs, linking, or `if`.

Before:

```tsx
const Stack = createNativeStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Stack.Navigator>
  );
}
```

After:

```tsx
const MyStack = createNativeStackNavigator({
  initialRouteName: 'Home',
  screenOptions: {
    headerShown: false,
  },
  screens: {
    Home: HomeScreen,
    Profile: createNativeStackScreen({
      screen: ProfileScreen,
      options: { title: 'My Profile' },
    }),
  },
});
```

Shorthand (component only, no config): `ScreenName: ScreenComponent`

Nested static navigator: `ScreenName: AnotherStaticNavigator`

All props on `<Navigator>` such as `initialRouteName`, `screenOptions` etc. become properties on the config object passed to `createXNavigator`. Props on `<Screen>` become properties on the screen config object. If a screen doesn't need a config object, use the shorthand form.

#### Use options callback for theme-dependent options

For screen options that depend on the navigation theme, keep them as screen-level `options` callbacks. The callback receives `theme`, so avoid using `useTheme()`.

```tsx
const MyStack = createNativeStackNavigator({
  screens: {
    Home: createNativeStackScreen({
      screen: HomeScreen,
      options: ({ theme }) => ({
        headerTintColor: theme.colors.primary,
      }),
    }),
  },
});
```

### Replace `navigation` prop with `useNavigation`

Screens no longer receive `navigation` as a prop in the static API. Replace prop destructuring with the `useNavigation()` hook in every screen component reached by the migration. The `route` prop is still passed.

Before:

```tsx
function HomeScreen({ navigation }) {
  return (
    <Button
      title="Go to profile"
      onPress={() => navigation.navigate('Profile')}
    />
  );
}
```

After:

```tsx
function HomeScreen() {
  const navigation = useNavigation();

  return (
    <Button
      title="Go to profile"
      onPress={() => navigation.navigate('Profile')}
    />
  );
}
```

### Convert nested navigators

Nested dynamic navigators rendered as components become nested config objects.

Before:

```tsx
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeTabs} />
    </Stack.Navigator>
  );
}
```

After:

```tsx
const HomeTabs = createBottomTabNavigator({
  screens: {
    Groups: GroupsScreen,
    Chats: ChatsScreen,
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    Home: HomeTabs,
  },
});
```

### Convert groups

Before:

```tsx
function RootStack() {
  return (
    <Stack.Navigator>
      <Stack.Group screenOptions={{ headerStyle: { backgroundColor: 'red' } }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
```

After:

```tsx
const RootStack = createNativeStackNavigator({
  groups: {
    Card: {
      screenOptions: { headerStyle: { backgroundColor: 'red' } },
      screens: {
        Home: HomeScreen,
        Profile: ProfileScreen,
      },
    },
    Modal: {
      screenOptions: { presentation: 'modal' },
      screens: {
        Settings: SettingsScreen,
      },
    },
  },
});
```

Top-level `screens` and `screenOptions` handle the default group.

Use `groups` when you need different shared options, conditional groups, grouped linking, or to logically group screens if the dynamic config already had such groups.

### Convert auth flows

To migrate conditional screens from dynamic config, use static `if` hooks. The `if` property takes a user-defined hook that returns a boolean such as `useIsSignedIn` or `useIsSignedOut`.

This prevents navigating to protected screens when signed out and unmounts auth screens after sign-in, so the back button cannot return to them.

If you previously used `navigationKey` to reset a screen when auth state changes, duplicate the screen in both auth groups. The group name is used for the key, so switching groups resets the screen. For example, declare `Help` in both the signed-in and signed-out groups instead of using `navigationKey`.

Loading UI should live outside the navigation tree, meaning outside `<NavigationContainer>` / `<Navigation>`, not in a `Loading` screen or group. Keep `screens` and `groups` for actual navigable routes only.

Use `.with()` for wrappers around a mounted navigator, not for boot or loading gates that should happen before rendering `<Navigation>`.

```tsx
const App = () => {
  const isLoading = useIsLoading();

  if (isLoading) {
    return <SplashScreen />;
  }

  return <Navigation />;
};
```

Before:

```tsx
function App() {
  const isSignedIn = useIsSignedIn();

  return (
    <Stack.Navigator>
      {isSignedIn ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
      <Stack.Screen
        navigationKey={isSignedIn ? 'signed-in' : 'signed-out'}
        name="Help"
        component={HelpScreen}
      />
    </Stack.Navigator>
  );
}
```

After:

```tsx
const RootStack = createNativeStackNavigator({
  groups: {
    SignedIn: {
      if: useIsSignedIn,
      screens: {
        Home: HomeScreen,
        Profile: ProfileScreen,
        Help: HelpScreen,
      },
    },
    SignedOut: {
      if: useIsSignedOut,
      screens: {
        SignIn: SignInScreen,
        SignUp: SignUpScreen,
        Help: HelpScreen,
      },
    },
  },
});
```

### Use `.with()` for wrappers, providers, and dynamic navigator props

If the dynamic navigator is rendered in a component that uses hooks for navigator-level behavior, or has wrappers around the mounted navigator, use `.with()` to provide this wrapper. This applies to navigator-level props such as `initialRouteName`, `backBehavior`, `screenOptions`, and `screenListeners` that are derived dynamically.

The `.with()` method takes a React component and can use hooks, render providers, wrap the navigator in additional components, return early etc.

#### Wrapping with a provider and dynamic props and options

Before:

```tsx
function MyStack() {
  const someValue = useSomeHook();

  return (
    <SomeProvider>
      <Stack.Navigator screenOptions={{ title: someValue }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </SomeProvider>
  );
}
```

After:

```tsx
const MyStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
  },
}).with(({ Navigator }) => {
  const someValue = useSomeHook();

  return (
    <SomeProvider>
      <Navigator screenOptions={{ title: someValue }} />
    </SomeProvider>
  );
});
```

If `screenOptions` or `screenListeners` are provided both in the static config and in `.with()`, they will be shallow merged automatically.

#### Using props based on parent route

Before:

```tsx
function MyStack({ route }) {
  return (
    <Stack.Navigator screenOptions={{ title: route.params.title }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
```

After:

```tsx
const MyStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
  },
}).with(({ Navigator }) => {
  const route = useRoute();

  return <Navigator screenOptions={{ title: route.params.title }} />;
});
```

#### Per-screen dynamic options via `screenOptions` callback

If each screen has different options, use a `screenOptions` callback and switch on `route.name`.

Before:

```tsx
function MyStack() {
  const getSomething = useSomeHook();

  return (
    <SomeProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: getSomething('First') }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: getSomething('Second') }}
        />
      </Stack.Navigator>
    </SomeProvider>
  );
}
```

After:

```tsx
const MyStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Profile: ProfileScreen,
  },
}).with(({ Navigator }) => {
  const getSomething = useSomeHook();

  return (
    <SomeProvider>
      <Navigator
        screenOptions={({ route }) => {
          switch (route.name) {
            case 'Home':
              return {
                title: getSomething('First'),
              };
            case 'Profile':
              return {
                title: getSomething('Second'),
              };
            default:
              return {};
          }
        }}
      />
    </SomeProvider>
  );
});
```

#### Convert render callbacks for screens

If any `<X.Screen>` uses a render-callback child (`{(props) => ...}`), read [`react-navigation-7-render-callbacks.md`](./react-navigation-7-render-callbacks.md).

#### Migrating `getComponent` lazy loading

If any `<X.Screen>` uses `getComponent=`, read [`react-navigation-7-get-component.md`](./react-navigation-7-get-component.md).

### Migrate screen-level linking

Use screen-level `linking` to replace the old root `linking.config.screens` structure.

Omit `linking` on a screen when the default kebab-case path is acceptable. If the path is identical to the auto path such as `Details` to `details`, remove the redundant `linking` entry.

Add `linking` for custom paths or when you need path params with `parse` or `stringify`.

Before:

```tsx
const linking = {
  prefixes: ['https://example.com'],
  config: {
    screens: {
      Home: '',
      Profile: {
        path: 'user/:id',
        parse: { id: Number },
      },
      Settings: 'settings',
    },
  },
};
```

After:

```tsx
const RootStack = createNativeStackNavigator({
  screens: {
    Home: createNativeStackScreen({
      screen: HomeScreen,
      linking: '', // explicit root path; omit if this is the first leaf screen or the initialRouteName
    }),
    Profile: createNativeStackScreen({
      screen: ProfileScreen,
      linking: {
        path: 'user/:id',
        parse: { id: Number },
      },
    }),
    Settings: SettingsScreen,
  },
});
```

Linking paths are auto-generated for leaf screens using kebab-case of the screen name. The first leaf screen, or the `initialRouteName` if set, gets the path `/` unless you set an explicit empty path on another screen.

To control auto-generated linking, pass `enabled` on the root `linking` prop. The default is `enabled: 'auto'`, which generates paths for all leaf screens. Pass `enabled: true` to turn off automatic path generation and define paths manually only for screens with explicit `linking`, or `enabled: false` to disable linking entirely.

If a screen previously had a custom path such as `linking: 'contacts'` and you remove it, the auto path becomes kebab-case of the screen name such as `TabContacts` to `tab-contacts`. This breaks existing URLs and deep links. Keep explicit `linking` when you need to preserve existing paths.

If screens containing navigators have `linking` set to `''` or `'/'`, it is usually redundant and can be removed.

Keep TypeScript param typing on the screen component with `StaticScreenProps`. Screen-level `linking` config is for URL parsing and serialization only.

### Update types

#### Getting navigation and route access

Use `StaticScreenProps` to type the screen's `route` prop.

Use the default `useNavigation()` type provided through the global `ReactNavigation.RootParamList` augmentation for navigator-agnostic navigation calls.

Prefer the screen `route` prop over `useRoute` when available. Use `useNavigationState` separately when you need navigation state.

Before:

```tsx
function ProfileScreen({
  navigation,
  route,
}: NativeStackScreenProps<MyStackParamList, 'Profile'>) {
  const id = route.params.id;
  navigation.navigate('Home');
}
```

After:

```tsx
type ProfileScreenProps = StaticScreenProps<{
  id: string;
}>;

function ProfileScreen({ route }: ProfileScreenProps) {
  const navigation = useNavigation();
  const id = route.params.id;

  navigation.navigate('Home');
}
```

Use `StaticScreenProps` to type the `route` prop. If you need navigator-specific APIs such as `push`, `pop`, `openDrawer`, or `setOptions`, you can manually annotate `useNavigation`, but this is not type-safe and should be kept to a minimum.

If you need a navigator-specific navigation object:

```tsx
type RootStackParamList = StaticParamList<typeof RootStack>;

type ProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const navigation = useNavigation<ProfileNavigationProp>();
```

#### Remove manual param lists

Remove all hand-written param-list declarations created only to support dynamic typing.

If a param list is absolutely necessary, derive it from the navigator type:

```tsx
type SomeStackType = typeof SomeStack;
type SomeStackParamList = StaticParamList<SomeStackType>;
```

If a static navigator nests a dynamic navigator, annotate the dynamic navigator screen with `StaticScreenProps<NavigatorScreenParams<...>>` so the nesting is reflected in the root param list.

For the root navigator, keep the single source of truth in the `RootParamList` augmentation shown below.

Avoid circular dependencies by:

- Using `StaticScreenProps` for screen params instead of shared hand-written param lists
- Using the default `useNavigation()` type where possible instead of navigator-specific aliases
- Deleting obsolete shared type files when they become empty

#### Root type augmentation

Place the global `RootParamList` augmentation next to the root static navigator. This is the single source of truth for the default types used by `useNavigation`, `Link`, refs, and related APIs.

```tsx
const RootStack = createNativeStackNavigator({
  screens: {
    // ...
  },
});

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

#### Typing params

Use `StaticScreenProps` to annotate route params, including screens that use `linking`.

A path such as `user/:userId` defines URL parsing and serialization. Keep the TypeScript param type on the screen component with `StaticScreenProps`.

If the params are not strings, use `parse` and `stringify` in the `linking` config:

```tsx
type ArticleScreenProps = StaticScreenProps<{
  date: Date;
}>;

function ArticleScreen({ route }: ArticleScreenProps) {
  return <Article date={route.params.date} />;
}

const RootStack = createNativeStackNavigator({
  screens: {
    Article: createNativeStackScreen({
      screen: ArticleScreen,
      linking: {
        path: 'article/:date',
        parse: {
          date: (date: string) => new Date(date),
        },
        stringify: {
          date: (date: Date) => date.toISOString(),
        },
      },
    }),
  },
});
```

The runtime parsing comes from `linking`. The compile-time param type comes from `StaticScreenProps`.

Avoid `any`, non-null assertions, and `as` assertions.

Before:

```tsx
type MyStackParamList = {
  Article: { author: string };
  Albums: undefined;
};

const Stack = createNativeStackNavigator<MyStackParamList>();

function ArticleScreen({
  navigation,
  route,
}: NativeStackScreenProps<MyStackParamList, 'Article'>) {
  return <Button onPress={() => navigation.navigate('Albums')} />;
}

function AlbumsScreen() {
  return <Albums />;
}

export function Example() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Article"
          component={ArticleScreen}
          options={({ route }) => ({ title: route.params.author })}
          initialParams={{ author: 'Gandalf' }}
        />
        <Stack.Screen name="Albums" component={AlbumsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

After:

```tsx
import {
  createStaticNavigation,
  type StaticParamList,
  type StaticScreenProps,
  useNavigation,
} from '@react-navigation/native';

type ArticleScreenProps = StaticScreenProps<{
  author: string;
}>;

function ArticleScreen({ route }: ArticleScreenProps) {
  const navigation = useNavigation();

  return (
    <Button
      title={route.params.author}
      onPress={() => navigation.navigate('Albums')}
    />
  );
}

function AlbumsScreen() {
  return <Albums />;
}

const RootStack = createNativeStackNavigator({
  screens: {
    Article: createNativeStackScreen({
      screen: ArticleScreen,
      options: ({ route }) => ({ title: route.params.author }),
      initialParams: { author: 'Gandalf' },
      linking: 'article/:author',
    }),
    Albums: AlbumsScreen,
  },
});

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Navigation = createStaticNavigation(RootStack);

export function Example() {
  return <Navigation />;
}
```

### Replace the root container

Replace `NavigationContainer` with `createStaticNavigation(RootStack)` once the root static navigator, screen-level linking, and root typing are in place. Then pass container-level props to the generated `Navigation` component.

Before:

```tsx
const linking = {
  prefixes: ['https://example.com', 'example://'],
  config: {
    screens: {
      Home: '',
      Profile: 'profile/:id',
    },
  },
};

function App() {
  return (
    <NavigationContainer linking={linking} theme={MyTheme}>
      <RootStack />
    </NavigationContainer>
  );
}
```

After:

```tsx
import { createStaticNavigation } from '@react-navigation/native';

const RootStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Profile: createNativeStackScreen({
      screen: ProfileScreen,
      linking: 'profile/:id',
    }),
  },
});

const Navigation = createStaticNavigation(RootStack);

function App() {
  return (
    <Navigation
      linking={{
        prefixes: ['https://example.com', 'example://'],
        enabled: 'auto',
      }}
      theme={MyTheme}
    />
  );
}
```

Keep screen path details on individual screens.

The `Navigation` component returned by `createStaticNavigation` cannot take a full `linking.config` object. Put per-screen paths in screen-level `linking`, and use the root `linking` prop only for container-level settings and root-level linking options.

Only configuration from the `screens` property needs to be moved to screen-level `linking`. Container-level linking options such as `prefixes`, custom `getStateFromPath`, `getPathFromState` and any other properties can still be passed to the root-level `linking` prop.

All the props that were previously passed to `NavigationContainer` such as `theme`, `fallback`, and `onReady` can be passed to the `Navigation` component without changes except for `children`, and require changes to `linking` as described above.

## Mixing Static and Dynamic APIs

Use mixed static/dynamic trees only as a fallback when full static migration is not possible. See [`react-navigation-7-mixing-apis.md`](./react-navigation-7-mixing-apis.md).

### Gotchas

#### Module-load timing

Static navigator config is created at module load time, not during component render.

Be careful with:

- `translate(...)`
- context-derived values
- feature-flag values read too early

If the value should resolve later, wrap it in a callback:

```tsx
options: () => ({
  tabBarLabel: translate('tabs:home'),
});
```

## Limitations

- Cannot use React hooks such as `useTheme()` directly in `options` or `listeners` callbacks. Use callback arguments such as `theme` instead.
- The screen list is static. Screens cannot be added or removed at runtime. Use `if` hooks for conditional rendering.
- No render callbacks on screens. Move extra props to React context and wrappers to `layout`.

## Review

1. All `@react-navigation/*` packages were updated to the latest published 7.x versions before migration.
2. No `NativeStackScreenProps`, `BottomTabScreenProps`, or custom screen-prop aliases remain. Use `useNavigation()` for access, the screen `route` prop when available, and `StaticScreenProps` for params.
3. `RootParamList` augmentation in `ReactNavigation` lives next to the root static navigator.
4. `createStaticNavigation` replaces `NavigationContainer`.
5. Root `linking` contains container-level settings such as `prefixes` and `enabled`. Screen paths live in screen-level `linking`.
6. Linking config is present only where custom paths or params are required. Defaults are kebab-case.
7. Every screen with params uses `StaticScreenProps`. Screen-level `linking` is used for URL parsing and serialization.
8. No render callbacks remain on screens. Extra props use React context and wrappers use `layout`.
9. Any previous `getComponent` screens now use custom utility
10. No hand-written param lists remain unless derived via `StaticParamList`.
11. No hooks are called directly in `screenOptions`, `options`, or `listeners` callbacks
12. Theme-dependent `options` use the `theme` callback argument instead of `.with()` plus `useTheme()`.
13. Loading or boot UI lives outside `<Navigation>`.
14. No circular type references or obsolete shared type files remain from the old dynamic setup.
