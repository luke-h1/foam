/* eslint-disable */
import * as AppleColors from '@bacons/apple-colors';
import {
  Children,
  type ComponentProps,
  Fragment,
  type ReactElement,
  type ReactNode,
  type Ref,
  cloneElement,
  isValidElement,
} from 'react';
import {
  Text as RNText,
  type StyleProp,
  StyleSheet,
  type TextProps,
  type TextStyle,
  View,
  type ViewInstance,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

export function HStack(props: ViewProps) {
  return (
    <View
      {...props}
      style={mergedStyleProp<ViewStyle>(
        {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          width: '100%',
        },
        props.style,
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
  ref?: Ref<ViewInstance>;
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
      {...(ref !== undefined ? { ref } : {})}
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

export function Text(
  props: TextProps & {
    hint?: ReactNode;
  },
) {
  return (
    <RNText
      dynamicTypeRamp='body'
      {...props}
      style={mergedStyleProp(FORM_TEXT_FONT, props.style)}
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

const FORM_TEXT_FONT: TextStyle = {
  ...FormFont.default,
  flexShrink: 0,
  fontWeight: 'normal',
};

/**
 * A Section's children may arrive wrapped in an unkeyed Fragment, so unwrap one
 * level and keep only the real elements.
 */
function flattenSectionChildren(children: ReactNode): ReactNode[] {
  const flattened: ReactNode[] = [];

  Children.forEach(children, child => {
    if (!isValidElement(child)) {
      return;
    }

    const isUnkeyedFragment = child.type === Fragment && child.key == null;

    if (!isUnkeyedFragment) {
      flattened.push(child);
      return;
    }

    Children.forEach(child, nested => {
      if (isValidElement(nested)) {
        flattened.push(nested);
      }
    });
  });

  return flattened;
}

function renderSectionHint(hint: ReactNode): ReactNode {
  if (!hint) {
    return null;
  }

  return Children.map(hint, child => {
    if (!child) {
      return null;
    }

    if (String(child) !== child) {
      return child;
    }

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
  });
}

function asSectionTextRow(
  child: ReactElement<Record<string, unknown>>,
  // The row props come off a cloned element, so they are untyped here. The
  // `@ts-expect-error`s in `Section` cover the same gap.
  resolvedProps: {
    hint?: ReactNode;
    style?: StyleProp<TextStyle>;
    [key: string]: unknown;
  },
): ReactElement {
  const text = cloneElement(child, {
    dynamicTypeRamp: 'body',
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
    ...resolvedProps,
    onPress: undefined,
    onLongPress: undefined,
    style: mergedStyleProp<TextStyle>(FormFont.default, resolvedProps.style),
  });

  const hintView = renderSectionHint(resolvedProps.hint);

  if (!hintView) {
    return text;
  }

  return (
    <HStack>
      {text}
      <View style={{ flex: 1 }} />
      {hintView}
    </HStack>
  );
}

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
  const allChildren = flattenSectionChildren(children);

  const childrenWithSeparator = allChildren.map((child, index) => {
    if (!isValidElement(child)) {
      return child;
    }

    const isLastChild = index === allChildren.length - 1;

    const resolvedProps = {
      // @ts-expect-error react 19 types not caught up
      ...child.props,
    };

    const originalOnPress = resolvedProps.onPress;
    const originalOnLongPress = resolvedProps.onLongPress;

    if (child.type === RNText || child.type === Text) {
      child = asSectionTextRow(
        child as ReactElement<Record<string, unknown>>,
        resolvedProps,
      ) as typeof child;
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
