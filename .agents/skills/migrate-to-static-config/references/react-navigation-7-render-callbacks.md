# Render Callbacks for Screens (React Navigation 7.x)

Use this file only when `<X.Screen>` elements use a render-callback child (e.g. `<Stack.Screen name="Chat">{(props) => <ChatScreen {...props} />}</Stack.Screen>`).

Static config doesn't support render callbacks on screens.

## Contents

- Additional screen props
- Wrappers
- Refs
- Combining patterns

## Additional screen props

For additional props passed to the screen component, move the data to React context and provide it via `.with()`.

Passing additional props via context:

Before:

```tsx
<Stack.Screen name="Chat">
  {(props) => <ChatScreen {...props} userToken={token} />}
</Stack.Screen>
```

After:

```tsx
const TokenContext = React.createContext('');

function ChatScreen() {
  const token = React.useContext(TokenContext);

  return <Chat token={token} />;
}

const MyStack = createNativeStackNavigator({
  screens: {
    Chat: ChatScreen,
  },
}).with(({ Navigator }) => {
  const token = useToken();

  return (
    <TokenContext.Provider value={token}>
      <Navigator />
    </TokenContext.Provider>
  );
});
```

## Wrappers

For wrappers around the screen component, move the wrapper to the screen's `layout`.

Before:

```tsx
<Stack.Screen name="Profile">
  {(props) => (
    <SomeWrapper>
      <ProfileScreen {...props} />
    </SomeWrapper>
  )}
</Stack.Screen>
```

After:

```tsx
const MyStack = createNativeStackNavigator({
  screens: {
    Profile: createNativeStackScreen({
      screen: ProfileScreen,
      layout: ({ children }) => <SomeWrapper>{children}</SomeWrapper>,
    }),
  },
});
```

## Refs

For refs passed to the screen component, use context and wrap the screen in an intermediate component.

Before:

```tsx
<Stack.Screen name="Profile">
  {(props) => <ProfileScreen {...props} ref={profileRef} />}
</Stack.Screen>
```

After:

```tsx
const ProfileScreenWithRef = () => {
  const profileRef = React.useContext(ProfileRefContext);

  return <ProfileScreen ref={profileRef} />;
};

const MyStack = createNativeStackNavigator({
  screens: {
    Profile: createNativeStackScreen({
      screen: ProfileScreenWithRef,
    }),
  },
}).with(({ Navigator }) => {
  const profileRef = React.useRef(null);

  return (
    <ProfileRefContext.Provider value={profileRef}>
      <Navigator />
    </ProfileRefContext.Provider>
  );
});
```

## Combining patterns

If multiple of these patterns are used on the same screen, use appropriate combinations of context and layout.
