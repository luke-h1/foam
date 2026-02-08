/* eslint-disable */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-restricted-imports */
import * as AppleColors from '@bacons/apple-colors';
import { useNavigation } from '@react-navigation/native';
import { SymbolWeight } from 'expo-symbols';
import React, { Children, isValidElement, ReactNode } from 'react';
import {
  Button,
  GestureResponderEvent,
  OpaqueColorValue,
  RefreshControl,
  Text as RNText,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  TouchableHighlight,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { BodyScrollView } from '../BodyScrollView/BodyScrollView';
import { IconSymbol, IconSymbolName } from '../IconSymbol/IconSymbol';

type ListStyle = 'grouped' | 'auto';

const ListStyleContext = React.createContext<ListStyle>('auto');

type RefreshCallback = () => Promise<void>;

const RefreshContext = React.createContext<{
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

const RefreshContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const subscribersRef = React.useRef<Set<RefreshCallback>>(new Set());
  const [subscriberCount, setSubscriberCount] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);

  const subscribe = (cb: RefreshCallback) => {
    subscribersRef.current.add(cb);
    setSubscriberCount(count => count + 1);

    return () => {
      subscribersRef.current.delete(cb);
      setSubscriberCount(count => count - 1);
    };
  };

  const refresh = async () => {
    const subscribers = Array.from(subscribersRef.current);
    if (subscribers.length === 0) return;

    setRefreshing(true);
    try {
      await Promise.all(subscribers.map(cb => cb()));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RefreshContext.Provider
      value={{
        subscribe,
        refresh,
        refreshing,
        hasSubscribers: subscriberCount > 0,
      }}
    >
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
  const { subscribe, refresh } = React.useContext(RefreshContext);

  // @ts-expect-error - not all code paths return a value
  React.useEffect(() => {
    if (callback) {
      const unsubscribe = subscribe(callback);
      return unsubscribe;
    }
  }, [callback, subscribe]);

  return refresh;
}

type ListProps = ScrollViewProps & {
  /** Set the React Navigation screen title when mounted. */
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
if (__DEV__) List.displayName = 'FormList';

function InnerList({
  contentContainerStyle,
  navigationTitle,
  ...props
}: ListProps) {
  const { hasSubscribers, refreshing, refresh } =
    React.useContext(RefreshContext);
  const navigation = useNavigation();

  // Set navigation title using React Navigation
  React.useEffect(() => {
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
});

export function FormItem({
  children,
  onPress,
  onLongPress,
  style,
  ref,
}: Pick<ViewProps, 'children'> & {
  onPress?: (event: any) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  ref?: React.Ref<View>;
}) {
  const itemStyle = [
    styles.itemPadding,
    {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    style,
  ];

  if (onPress == null && onLongPress == null) {
    return (
      // @ts-expect-error react 19 types
      <View style={itemStyle}>
        <HStack style={{ minHeight: minItemHeight }}>{children}</HStack>
      </View>
    );
  }
  return (
    <TouchableHighlight
      ref={ref}
      underlayColor={AppleColors.systemGray4}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* @ts-expect-error react 19 types */}
      <View style={itemStyle}>
        <HStack style={{ minHeight: minItemHeight }}>{children}</HStack>
      </View>
    </TouchableHighlight>
  );
}

const Colors = {
  systemGray4: AppleColors.systemGray4, // "rgba(209, 209, 214, 1)",
  secondarySystemGroupedBackground:
    AppleColors.secondarySystemGroupedBackground, // "rgba(255, 255, 255, 1)",
  separator: AppleColors.separator, // "rgba(61.2, 61.2, 66, 0.29)",
};

type SystemImageCustomProps = {
  name: IconSymbolName;
  color?: OpaqueColorValue;
  size?: number;
  weight?: SymbolWeight;
  style?: StyleProp<TextStyle>;
};

type SystemImageProps = IconSymbolName | SystemImageCustomProps;

/** Text but with iOS default color and sizes. */
export function Text({
  bold,
  ...props
}: TextProps & {
  /** Value displayed on the right side of the form item. */
  hint?: React.ReactNode;
  /** A true/false value for the hint. */
  hintBoolean?: React.ReactNode;
  /** Adds a prefix SF Symbol image to the left of the text */
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
      dynamicTypeRamp="body"
      {...props}
      style={mergedStyleProp(font, props.style)}
    />
  );
}

if (__DEV__) Text.displayName = 'FormText';

// React Navigation compatible Link component
export function Link({
  bold,
  children,
  headerRight,
  hintImage,
  onPress,
  ...props
}: {
  /** Value displayed on the right side of the form item. */
  hint?: React.ReactNode;
  /** Adds a prefix SF Symbol image to the left of the text. */
  systemImage?: SystemImageProps | React.ReactNode;
  /** Changes the right icon. */
  hintImage?: SystemImageProps | React.ReactNode;
  /** Is the link inside a header. */
  headerRight?: boolean;
  bold?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
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
        return <div style={{ paddingRight: 16 }}>{children}</div>;
      }
      const wrappedTextChildren = React.Children.map(children, child => {
        // Filter out empty children
        if (!child) {
          return null;
        }
        if (typeof child === 'string') {
          return (
            <RNText
              style={mergedStyleProp<TextStyle>(
                { ...font, color: AppleColors.link },

                // @ts-ignore
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
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            // Offset on the side so the margins line up. Unclear how to handle when this is used in headerLeft.
            // We should automatically detect it somehow.
            marginRight: -8,
          }}
          onPress={onPress}
        >
          {wrappedTextChildren}
        </TouchableOpacity>
      );
    }
    return children;
  })();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      // @ts-ignore
      style={mergedStyleProp<TextStyle>(font, props.style)}
    >
      {resolvedChildren}
    </TouchableOpacity>
  );
}

if (__DEV__) Link.displayName = 'FormLink';

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
};

export function Section({
  children,
  title,
  titleHint,
  footer,
  ...props
}: ViewProps & {
  title?: string | React.ReactNode;
  titleHint?: string | React.ReactNode;
  footer?: string | React.ReactNode;
}) {
  const listStyle = React.useContext(ListStyleContext) ?? 'auto';

  const allChildren: React.ReactNode[] = [];

  // @ts-expect-error react 19 types not caught up

  Children.map(children, child => {
    if (!React.isValidElement(child)) {
      return child;
    }

    // If the child is a fragment, unwrap it and add the children to the list
    if (child.type === React.Fragment && child.key == null) {
      React.Children.forEach(child, child => {
        if (!React.isValidElement(child)) {
          return child;
        }
        allChildren.push(child);
      });
      return;
    }

    allChildren.push(child);
  });

  const childrenWithSeparator = allChildren.map((child, index) => {
    if (!React.isValidElement(child)) {
      return child;
    }
    const isLastChild = index === allChildren.length - 1;

    const resolvedProps = {
      // @ts-expect-error react 19 types not caught up
      ...child.props,
    };

    // Set the hint for the hintBoolean prop.
    if (resolvedProps.hintBoolean != null) {
      resolvedProps.hint ??= resolvedProps.hintBoolean ? (
        <IconSymbol
          name="checkmark.circle.fill"
          color={AppleColors.systemGreen}
        />
      ) : (
        <IconSymbol name="slash.circle" color={AppleColors.systemGray} />
      );
    }

    // Extract onPress from child
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
      child = React.cloneElement(child, {
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

        return React.Children.map(resolvedProps.hint, child => {
          // Filter out empty children
          if (!child) {
            return null;
          }
          if (typeof child === 'string') {
            return (
              <RNText
                selectable
                dynamicTypeRamp="body"
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
            <SymbolView
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

      const wrappedTextChildren = React.Children.map(
        resolvedProps.children,
        linkChild => {
          // Filter out empty children
          if (!linkChild) {
            return null;
          }
          if (typeof linkChild === 'string') {
            return (
              <RNText
                dynamicTypeRamp="body"
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

        return React.Children.map(resolvedProps.hint, child => {
          // Filter out empty children
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

      child = React.cloneElement(child, {
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
              <SymbolView
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
      <>
        {child}
        {!isLastChild && <Separator />}
      </>
    );
  });

  const contents = (
    <Animated.View
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
    </Animated.View>
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
          dynamicTypeRamp="footnote"
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
            dynamicTypeRamp="footnote"
            style={{
              textTransform: 'uppercase',
              color: AppleColors.secondaryLabel,

              paddingVertical: 8,
              fontSize: 14,
              // use Apple condensed font
              // fontVariant: ["small-caps"],
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
          dynamicTypeRamp="footnote"
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

function isStringishNode(node: React.ReactNode): boolean {
  if (typeof node === 'string') {
    return true;
  }

  if (node == null) {
    return false;
  }

  let containsStringChildren = false;

  React.Children.forEach(node, child => {
    if (containsStringChildren) {
      return; // Early return if we already found a string
    }

    if (typeof child === 'string' || typeof child === 'number') {
      containsStringChildren = true;
    } else if (
      React.isValidElement(child) &&
      'props' in child &&
      typeof child.props === 'object' &&
      child.props !== null &&
      'children' in child.props
    ) {
      // Recurse on children prop, not the entire child element
      // This prevents infinite recursion
      containsStringChildren = isStringishNode(
        child.props.children as React.ReactNode,
      );
    }
  });
  return containsStringChildren;
}

function SymbolView({
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

  // @ts-ignore
  const symbolProps: SystemImageCustomProps =
    typeof systemImage === 'object' && 'name' in systemImage
      ? systemImage
      : { name: systemImage as unknown as string };

  return (
    <IconSymbol
      name={symbolProps.name}
      size={symbolProps.size ?? 20}
      style={[{ marginRight: 8 }, symbolProps.style]}
      weight={symbolProps.weight}
      color={
        symbolProps.color ?? extractStyle(style, 'color') ?? AppleColors.label
      }
    />
  );
}

function LinkChevronIcon({
  systemImage,
}: {
  systemImage?: SystemImageProps | React.ReactNode;
}) {
  const size = process.env.EXPO_OS === 'ios' ? 14 : 24;

  if (systemImage) {
    if (typeof systemImage !== 'string') {
      if (React.isValidElement(systemImage)) {
        return systemImage;
      }
      return (
        <IconSymbol
          // @ts-ignore
          name={systemImage.name}
          // @ts-ignore
          size={systemImage.size ?? size}
          // @ts-ignore
          color={systemImage.color ?? AppleColors.tertiaryLabel}
        />
      );
    }
  }

  const resolvedName =
    typeof systemImage === 'string' ? systemImage : 'chevron.right';

  return (
    <IconSymbol
      name={resolvedName as IconSymbolName}
      size={size}
      weight="bold"
      // from xcode, not sure which color is the exact match
      // #BFBFBF
      // #9D9DA0
      color={AppleColors.tertiaryLabel}
    />
  );
}

function Separator() {
  return (
    <View
      style={{
        marginStart: 60,
        borderBottomWidth: 0.5, //StyleSheet.hairlineWidth,
        marginTop: -0.5, // -StyleSheet.hairlineWidth,
        borderBottomColor: Colors.separator,
      }}
    />
  );
}

function mergedStyles(style: ViewStyle | TextStyle, props: any) {
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

function extractStyle(styleProp: any, key: string) {
  if (styleProp == null) {
    return undefined;
  }
  if (Array.isArray(styleProp)) {
    // @ts-ignore
    return styleProp.find(style => {
      return style[key] != null;
    })?.[key];
  }
  if (typeof styleProp === 'object') {
    return styleProp?.[key];
  }
  return null;
}
