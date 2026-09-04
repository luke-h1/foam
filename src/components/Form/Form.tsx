/* eslint-disable */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-restricted-imports */
import * as AppleColors from '@bacons/apple-colors';
import {
  SymbolView,
  type SymbolViewProps,
  type SymbolWeight,
} from '@app/components/ui/Icon/Icon';
import {
  Children,
  ComponentProps,
  Fragment,
  ReactNode,
  Ref,
  cloneElement,
  isValidElement,
} from 'react';
import {
  OpaqueColorValue,
  Text as RNText,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

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

function FormItem({
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

const FormFont = {
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
  const allChildren: ReactNode[] = [];

  // @ts-expect-error react 19 types not caught up

  Children.map(children, child => {
    if (!isValidElement(child)) {
      return child;
    }

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

    if (child.type === RNText || child.type === Text) {
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
    }

    // @ts-expect-error react 19 types
    if (!child.props.custom && child.type !== FormItem) {
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
        {
          borderCurve: 'continuous',
          overflow: 'hidden',
          borderRadius: 10,
          backgroundColor: AppleColors.secondarySystemGroupedBackground,
        },
        props.style,
      ]}
    >
      {childrenWithSeparator}
    </View>
  );

  if (!title && !footer) {
    return <View style={{ paddingHorizontal: 16 }}>{contents}</View>;
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
    <View style={{ paddingHorizontal: 16 }}>
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
      return;
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
      // Recurse on the children prop only - recursing on the element itself loops forever.
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

function Separator() {
  return (
    <View
      style={{
        marginStart: 60,
        borderBottomWidth: 0.5,
        marginTop: -0.5,
        borderBottomColor: AppleColors.separator,
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

function mergedStyleProp<TStyle extends ViewStyle | TextStyle>(
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
