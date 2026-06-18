# Migrating `getComponent` Lazy Loading (React Navigation 7.x)

Use this file only when `<X.Screen>` elements use the `getComponent=` prop for lazy loading.

Static config uses a `screen` component and doesn't support `getComponent`. Use a custom utility to lazily render the screen:

```tsx
const lazyScreen = <T extends React.ComponentType<any>>(
  getComponent: () => T,
) => {
  return function LazyScreen(props: React.ComponentProps<T>) {
    const Component = getComponent();

    return <Component {...props} />;
  };
};
```

Place this utility in a shared file such as `utils/lazyScreen.ts` following the pattern of other shared utilities in the codebase.

Then, replace `getComponent` with the lazy screen:

Before:

```tsx
<Stack.Screen
  name="Settings"
  getComponent={() => require('./SettingsScreen').default}
/>
```

After:

```tsx
const MyStack = createNativeStackNavigator({
  screens: {
    Settings: createNativeStackScreen({
      screen: lazyScreen<typeof import('./SettingsScreen').default>(
        () => require('./SettingsScreen').default,
      ),
    }),
  },
});
```
