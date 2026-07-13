/* eslint-disable */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-restricted-imports */
import * as AppleColors from '@bacons/apple-colors';
import { useNavigation } from 'expo-router';
import {
  SymbolView,
  type SymbolViewProps,
  type SymbolWeight,
} from '@app/components/ui/Icon/Icon';
import {
  Children,
  ComponentProps,
  FC,
  Fragment,
  ReactNode,
  Ref,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  OpaqueColorValue,
  RefreshControl,
  Text as RNText,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { BodyScrollView } from '../BodyScrollView/BodyScrollView';

type ListStyle = 'grouped' | 'auto';

const ListStyleContext = createContext<ListStyle>('auto');

type RefreshCallback = () => Promise<void>;

const RefreshContext = createContext<{
  subscribe: (cb: RefreshCallback) => () => void;
  hasSubscribers: boolean;
  refresh: () => Promise<void>;
  refreshing: boolean;
}>({
  subscribe: () => () => {},
  hasSubscribers: false,
  refresh: async () => {},
  refreshing: false,
});

const RefreshContextProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const subscribersRef = useRef<Set<RefreshCallback>>(new Set());
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const subscribe = useCallback((cb: RefreshCallback) => {
    subscribersRef.current.add(cb);
    setSubscriberCount(count => count + 1);

    return () => {
      subscribersRef.current.delete(cb);
      setSubscriberCount(count => count - 1);
    };
  }, []);

  const refresh = useCallback(async () => {
    const subscribers = Array.from(subscribersRef.current);
    if (subscribers.length === 0) {
      return;
    }

    setRefreshing(true);
    try {
      await Promise.all(subscribers.map(cb => cb()));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      subscribe,
      refresh,
      refreshing,
      hasSubscribers: subscriberCount > 0,
    }),
    [subscribe, refresh, refreshing, subscriberCount],
  );

  return (
    <RefreshContext.Provider value={contextValue}>
      {children}
    </RefreshContext.Provider>
  );
};

/**
 * Register a callback to be called when the user pulls down to refresh in the nearest list.
 *
 * @param callback Register a function to be called when the user pulls down to refresh.
 * The function should return a promise that resolves when the refresh is complete.
 * @returns A function that can be called to trigger a list-wide refresh.
 */
export function useListRefresh(callback?: () => Promise<void>) {
  const { subscribe, refresh } = useContext(RefreshContext);

  // @ts-expect-error - not all code paths return a value
  useEffect(() => {
    if (callback) {
      const unsubscribe = subscribe(callback);
      return unsubscribe;
    }
  }, [callback, subscribe]);

  return refresh;
}

type ListProps = ScrollViewProps & {
  navigationTitle?: string;
  listStyle?: ListStyle;
};

export function List(props: ListProps) {
  return (
    <RefreshContextProvider>
      <InnerList {...props} />
    </RefreshContextProvider>
  );
}
if (__DEV__) {
  List.displayName = 'FormList';
}

function InnerList({
  contentContainerStyle,
  navigationTitle,
  ...props
}: ListProps) {
  const { hasSubscribers, refreshing, refresh } = useContext(RefreshContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (navigationTitle) {
      navigation.setOptions({ title: navigationTitle });
    }
  }, [navigationTitle, navigation]);

  return (
    <ListStyleContext.Provider value={props.listStyle ?? 'auto'}>
      <BodyScrollView
        contentContainerStyle={mergedStyleProp(
          {
            paddingVertical: 16,
            gap: 24,
          },
          contentContainerStyle,
        )}
        style={{
          maxWidth: 768,
          width: process.env.EXPO_OS === 'web' ? '100%' : undefined,
          marginHorizontal: process.env.EXPO_OS === 'web' ? 'auto' : undefined,
        }}
        refreshControl={
          hasSubscribers ? (
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          ) : undefined
        }
        {...props}
      />
    </ListStyleContext.Provider>
  );
}

export function HStack(props: ViewProps) {
  return (
    <View
      {...props}
      style={mergedStyles(
        {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          width: '100%',
        },
        props,
      )}
    />
  );
}

const minItemHeight = 20;

const styles = StyleSheet.create({
  itemPadding: {
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  itemRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

type FormPressableProps = ComponentProps<typeof Pressable>;

export function FormItem({
  children,
  onPress,
  onLongPress,
  style,
  ref,
}: Pick<ViewProps, 'children'> & {
  onPress?: FormPressableProps['onPress'];
  onLongPress?: FormPressableProps['onLongPress'];
  style?: ViewStyle;
  ref?: Ref<View>;
}) {
  const itemStyle: StyleProp<ViewStyle> = [
    styles.itemPadding,
    styles.itemRow,
    style,
  ];

  if (onPress == null && onLongPress == null) {
    return (
      <View style={itemStyle}>
        <HStack style={{ minHeight: minItemHeight }}>{children}</HStack>
      </View>
    );
  }
  return (
    <Pressable
      ref={ref}
      accessibilityRole='button'
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        itemStyle,
        pressed ? { backgroundColor: AppleColors.systemGray4 } : null,
      ]}
    >
      <View>
        <HStack style={{ minHeight: minItemHeight }}>{children}</HStack>
      </View>
    </Pressable>
  );
}

const Colors = {
  systemGray4: AppleColors.systemGray4, // "rgba(209, 209, 214, 1)",
  secondarySystemGroupedBackground:
    AppleColors.secondarySystemGroupedBackground, // "rgba(255, 255, 255, 1)",
  separator: AppleColors.separator, // "rgba(61.2, 61.2, 66, 0.29)",
};

type SystemImageCustomProps = {
  name: SymbolViewProps['name'];
  color?: OpaqueColorValue;
  size?: number;
  weight?: SymbolWeight;
  style?: StyleProp<TextStyle>;
};

type SystemImageProps = SymbolViewProps['name'] | SystemImageCustomProps;

export function Text({
  bold,
  ...props
}: TextProps & {
  hint?: ReactNode;
  hintBoolean?: ReactNode;
  systemImage?: SystemImageProps;

  bold?: boolean;
}) {
  const font: TextStyle = {
    ...FormFont.default,
    flexShrink: 0,
    fontWeight: bold ? '600' : 'normal',
  };

  return (
    <RNText
      dynamicTypeRamp='body'
      {...props}
      style={mergedStyleProp(font, props.style)}
    />
  );
}

if (__DEV__) {
  Text.displayName = 'FormText';
}

// React Navigation compatible Link component
export function Link({
  bold,
  children,
  headerRight,
  hintImage,
  onPress,
  ...props
}: {
  hint?: ReactNode;
  systemImage?: SystemImageProps | ReactNode;
  hintImage?: SystemImageProps | ReactNode;
  headerRight?: boolean;
  bold?: boolean;
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  const font: TextStyle = {
    ...FormFont.default,
    fontWeight: bold ? '600' : 'normal',
  };

  const resolvedChildren = (() => {
    if (headerRight) {
      if (process.env.EXPO_OS === 'web') {
        return (
          <div style={{ paddingRight: 16, width: '100%' }}>{children}</div>
        );
      }
      const wrappedTextChildren = Children.map(children, child => {
        if (!child) {
          return null;
        }
        if (typeof child === 'string') {
          return (
            <RNText
              style={mergedStyleProp<TextStyle>(
                { ...font, color: AppleColors.link },
                props.style,
              )}
            >
              {child}
            </RNText>
          );
        }
        return child;
      });

      return (
        <Pressable
          style={({ pressed }) => [
            // Offset on the side so the margins line up. Unclear how to handle when this is used in headerLeft.
            // We should automatically detect it somehow.
            {
              marginRight: -8,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={onPress}
        >
          {wrappedTextChildren}
        </Pressable>
      );
    }
    const wrappedTextChildren = Children.map(children, child => {
      if (!child) {
        return null;
      }
      if (typeof child === 'string') {
        return (
          <RNText style={mergedStyleProp<TextStyle>(font, props.style)}>
            {child}
          </RNText>
        );
      }
      return child;
    });

    return wrappedTextChildren;
  })();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        mergedStyleProp<TextStyle>(font, props.style),
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {resolvedChildren}
    </Pressable>
  );
}

if (__DEV__) {
  Link.displayName = 'FormLink';
}

export const FormFont = {
  // From inspecting SwiftUI `List { Text("Foo") }` in Xcode.
  default: {
    color: AppleColors.label,
    // 17.00pt is the default font size for a Text in a List.
    fontSize: 17,
    // UICTFontTextStyleBody is the default fontFamily.
  },
  secondary: {
    color: AppleColors.secondaryLabel,
    fontSize: 17,
  },
  caption: {
    color: AppleColors.secondaryLabel,
    fontSize: 12,
  },
  title: {
    color: AppleColors.label,
    fontSize: 17,
    fontWeight: '600',
  },
} satisfies Record<string, TextStyle>;

export function Section({
  children,
  title,
  titleHint,
  footer,
  ...props
}: ViewProps & {
  title?: string | ReactNode;
  titleHint?: string | ReactNode;
  footer?: string | ReactNode;
}) {
  const listStyle = useContext(ListStyleContext) ?? 'auto';

  const allChildren: ReactNode[] = [];

  // @ts-expect-error react 19 types not caught up

  Children.map(children, child => {
    if (!isValidElement(child)) {
      return child;
    }

    // If the child is a fragment, unwrap it and add the children to the list
    if (child.type === Fragment && child.key == null) {
      Children.forEach(child, child => {
        if (!isValidElement(child)) {
          return child;
        }
        allChildren.push(child);
      });
      return;
    }

    allChildren.push(child);
  });

  const childrenWithSeparator = allChildren.map((child, index) => {
    if (!isValidElement(child)) {
      return child;
    }
    const isLastChild = index === allChildren.length - 1;

    const resolvedProps = {
      // @ts-expect-error react 19 types not caught up
      ...child.props,
    };

    if (resolvedProps.hintBoolean != null) {
      resolvedProps.hint ??= resolvedProps.hintBoolean ? (
        <SymbolView
          name='checkmark.circle.fill'
          tintColor={AppleColors.systemGreen}
        />
      ) : (
        <SymbolView name='slash.circle' tintColor={AppleColors.systemGray} />
      );
    }

    const originalOnPress = resolvedProps.onPress;
    const originalOnLongPress = resolvedProps.onLongPress;
    let wrapsFormItem = false;
    if (child.type === Button) {
      const { title, color } = resolvedProps;

      delete resolvedProps.title;
      resolvedProps.style = mergedStyleProp(
        { color: color ?? AppleColors.link },
        resolvedProps.style,
      );
      child = <RNText {...resolvedProps}>{title}</RNText>;
    }

    if (
      // If child is type of Text, add default props
      child.type === RNText ||
      child.type === Text
    ) {
      child = cloneElement(child, {
        dynamicTypeRamp: 'body',
        numberOfLines: 1,
        adjustsFontSizeToFit: true,
        ...resolvedProps,
        onPress: undefined,
        onLongPress: undefined,
        style: mergedStyleProp(FormFont.default, resolvedProps.style),
      });

      const hintView = (() => {
        if (!resolvedProps.hint) {
          return null;
        }

        return Children.map(resolvedProps.hint, child => {
          if (!child) {
            return null;
          }
          if (typeof child === 'string') {
            return (
              <RNText
                selectable
                dynamicTypeRamp='body'
                style={{
                  ...FormFont.secondary,
                  textAlign: 'right',
                  flexShrink: 1,
                }}
              >
                {child}
              </RNText>
            );
          }
          return child;
        });
      })();

      if (hintView || resolvedProps.systemImage) {
        child = (
          <HStack>
            <SystemImageView
              systemImage={resolvedProps.systemImage}
              style={resolvedProps.style}
            />
            {child}
            {hintView && <View style={{ flex: 1 }} />}
            {hintView}
          </HStack>
        );
      }
    } else if (child.type === Link) {
      wrapsFormItem = true;

      const wrappedTextChildren = Children.map(
        resolvedProps.children,
        linkChild => {
          if (!linkChild) {
            return null;
          }
          if (typeof linkChild === 'string') {
            return (
              <RNText
                dynamicTypeRamp='body'
                style={mergedStyles(FormFont.default, resolvedProps)}
              >
                {linkChild}
              </RNText>
            );
          }
          return linkChild;
        },
      );

      const hintView = (() => {
        if (!resolvedProps.hint) {
          return null;
        }

        return Children.map(resolvedProps.hint, child => {
          if (!child) {
            return null;
          }
          if (typeof child === 'string') {
            return (
              <Text selectable style={FormFont.secondary}>
                {child}
              </Text>
            );
          }

          return child;
        });
      })();

      child = cloneElement(child, {
        // @ts-expect-error react 19 types not caught up
        style: [
          FormFont.default,
          process.env.EXPO_OS === 'web' && {
            alignItems: 'stretch',
            flexDirection: 'column',
            display: 'flex',
          },
          resolvedProps.style,
        ],
        dynamicTypeRamp: 'body',
        numberOfLines: 1,
        adjustsFontSizeToFit: true,
        children: (
          <FormItem>
            <HStack>
              <SystemImageView
                systemImage={resolvedProps.systemImage}
                style={resolvedProps.style}
              />
              {wrappedTextChildren}
              <View style={{ flex: 1 }} />
              {hintView}
              <View style={{ paddingLeft: 12 }}>
                <LinkChevronIcon systemImage={resolvedProps.hintImage} />
              </View>
            </HStack>
          </FormItem>
        ),
      });
    }

    // @ts-expect-error react 19 types
    if (!wrapsFormItem && !child.props.custom && child.type !== FormItem) {
      child = (
        <FormItem onPress={originalOnPress} onLongPress={originalOnLongPress}>
          {child}
        </FormItem>
      );
    }

    return (
      <Fragment key={child.key ?? `section-item-${index}`}>
        {child}
        {!isLastChild && <Separator />}
      </Fragment>
    );
  });

  const contents = (
    <View
      {...props}
      style={[
        listStyle === 'grouped'
          ? {
              backgroundColor: Colors.secondarySystemGroupedBackground,
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
              borderColor: Colors.separator,
            }
          : {
              borderCurve: 'continuous',
              overflow: 'hidden',
              borderRadius: 10,
              backgroundColor: Colors.secondarySystemGroupedBackground,
            },
        props.style,
      ]}
    >
      {childrenWithSeparator}
    </View>
  );

  const padding = listStyle === 'grouped' ? 0 : 16;

  if (!title && !footer) {
    return (
      <View
        style={{
          paddingHorizontal: padding,
        }}
      >
        {contents}
      </View>
    );
  }

  const titleHintJsx = (() => {
    if (!titleHint) {
      return null;
    }

    if (isStringishNode(titleHint)) {
      return (
        <RNText
          dynamicTypeRamp='footnote'
          style={{
            color: AppleColors.secondaryLabel,
            paddingVertical: 8,
            fontSize: 14,
          }}
        >
          {titleHint}
        </RNText>
      );
    }

    return titleHint;
  })();

  return (
    <View
      style={{
        paddingHorizontal: padding,
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          gap: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {title && (
          <RNText
            dynamicTypeRamp='footnote'
            style={{
              textTransform: 'uppercase',
              color: AppleColors.secondaryLabel,

              paddingVertical: 8,
              fontSize: 14,
            }}
          >
            {title}
          </RNText>
        )}
        {titleHintJsx}
      </View>
      {contents}
      {footer && (
        <RNText
          dynamicTypeRamp='footnote'
          style={{
            color: AppleColors.secondaryLabel,
            paddingHorizontal: 20,
            paddingTop: 8,
            fontSize: 14,
          }}
        >
          {footer}
        </RNText>
      )}
    </View>
  );
}

function isStringishNode(node: ReactNode): boolean {
  if (typeof node === 'string') {
    return true;
  }

  if (node == null) {
    return false;
  }

  let containsStringChildren = false;

  Children.forEach(node, child => {
    if (containsStringChildren) {
      return; // Early return if we already found a string
    }

    if (typeof child === 'string' || typeof child === 'number') {
      containsStringChildren = true;
    } else if (
      isValidElement(child) &&
      'props' in child &&
      typeof child.props === 'object' &&
      child.props !== null &&
      'children' in child.props
    ) {
      // Recurse on children prop, not the entire child element
      // This prevents infinite recursion
      containsStringChildren = isStringishNode(
        child.props.children as ReactNode,
      );
    }
  });
  return containsStringChildren;
}

function SystemImageView({
  systemImage,
  style,
}: {
  systemImage?: SystemImageProps | ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  if (!systemImage) {
    return null;
  }

  if (typeof systemImage !== 'string' && isValidElement(systemImage)) {
    return systemImage;
  }

  const symbolProps: SystemImageCustomProps =
    typeof systemImage === 'object' &&
    systemImage !== null &&
    'name' in systemImage
      ? (systemImage as SystemImageCustomProps)
      : { name: systemImage as SymbolViewProps['name'] };

  return (
    <SymbolView
      name={symbolProps.name}
      size={symbolProps.size ?? 20}
      style={[{ marginRight: 8 }, symbolProps.style]}
      weight={symbolProps.weight}
      tintColor={
        symbolProps.color ?? extractStyle(style, 'color') ?? AppleColors.label
      }
    />
  );
}

function LinkChevronIcon({
  systemImage,
}: {
  systemImage?: SystemImageProps | ReactNode;
}) {
  const size = process.env.EXPO_OS === 'ios' ? 14 : 24;

  if (systemImage && typeof systemImage !== 'string') {
    if (isValidElement(systemImage)) {
      return systemImage;
    }
    const symbolProps: SystemImageCustomProps =
      typeof systemImage === 'object' && 'name' in systemImage
        ? systemImage
        : { name: systemImage as SymbolViewProps['name'] };

    return (
      <SymbolView
        name={symbolProps.name}
        size={symbolProps.size ?? size}
        tintColor={symbolProps.color ?? AppleColors.tertiaryLabel}
      />
    );
  }

  const resolvedName =
    typeof systemImage === 'string' ? systemImage : 'chevron.right';

  return (
    <SymbolView
      name={resolvedName as SymbolViewProps['name']}
      size={size}
      weight='bold'
      tintColor={AppleColors.tertiaryLabel}
    />
  );
}

function Separator() {
  return (
    <View
      style={{
        marginStart: 60,
        borderBottomWidth: 0.5,
        marginTop: -0.5,
        borderBottomColor: Colors.separator,
      }}
    />
  );
}

function mergedStyles(
  style: ViewStyle | TextStyle,
  props: { style?: StyleProp<ViewStyle | TextStyle> },
) {
  return mergedStyleProp(style, props.style);
}

export function mergedStyleProp<TStyle extends ViewStyle | TextStyle>(
  style: TStyle,
  styleProps?: StyleProp<TStyle> | null,
): StyleProp<TStyle> {
  if (styleProps == null) {
    return style;
  }
  if (Array.isArray(styleProps)) {
    return [style, ...styleProps];
  }
  return [style, styleProps];
}

function extractStyle<K extends keyof TextStyle>(
  styleProp: StyleProp<TextStyle> | undefined,
  key: K,
): TextStyle[K] | undefined {
  if (styleProp == null) {
    return undefined;
  }
  if (Array.isArray(styleProp)) {
    for (const entry of styleProp) {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        const value = (entry as TextStyle)[key];
        if (value != null) {
          return value;
        }
      }
    }
    return undefined;
  }
  if (typeof styleProp === 'object') {
    return styleProp[key];
  }
  return undefined;
}
