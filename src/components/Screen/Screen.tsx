import { useScrollToTop } from '@react-navigation/native';
import React, { ReactNode, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StatusBar,
  StyleProp,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import {
  Edge,
  SafeAreaView,
  SafeAreaViewProps,
} from 'react-native-safe-area-context';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

interface BaseScreenProps {
  children: ReactNode;
  /**
   * Style for the outer content container useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Style for the inner content container useful for padding & margin.
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Override the default edges for the safe area.
   */
  safeAreaEdges?: Edge[];
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Status bar setting. Defaults to dark.
   */
  statusBarStyle?: 'light' | 'dark';
  /**
   * By how much should we offset the keyboard? Defaults to 0.
   */
  keyboardOffset?: number;
  /**
   * Pass any additional props directly to the SafeAreaView component.
   */
  SafeAreaViewProps?: SafeAreaViewProps;
  /**
   * Pass any additional props directly to the KeyboardAvoidingView component.
   */
  KeyboardAvoidingViewProps?: KeyboardAvoidingViewProps;
}

interface FixedScreenProps extends BaseScreenProps {
  preset?: 'fixed';
}

interface ScrollScreenProps extends BaseScreenProps {
  preset?: 'scroll';
  /**
   * Should keyboard persist on screen tap. Defaults to handled.
   * Only applies to scroll preset.
   */
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
  /**
   * Pass any additional props directly to the ScrollView component.
   */
  ScrollViewProps?: ScrollViewProps;
}

interface AutoScreenProps extends Omit<ScrollScreenProps, 'preset'> {
  preset?: 'auto';
  /**
   * Threshold to trigger the automatic disabling/enabling of scroll ability.
   * Defaults to `{ percent: 0.92 }`.
   */
  scrollEnabledToggleThreshold?: { percent?: number; point?: number };
}

export type ScreenProps =
  | ScrollScreenProps
  | FixedScreenProps
  | AutoScreenProps;

const isIos = Platform.OS === 'ios';

function isNonScrolling(preset?: ScreenProps['preset']) {
  return !preset || preset === 'fixed';
}

function useAutoPreset({
  preset,
  scrollEnabledToggleThreshold,
}: AutoScreenProps) {
  const { percent = 0.92, point = 0 } = scrollEnabledToggleThreshold || {};

  const scrollViewHeight = useRef<number | null>(null);
  const scrollViewContentHeight = useRef<number | null>(null);

  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  function updateScrollState() {
    if (
      scrollViewHeight.current === null ||
      scrollViewContentHeight.current === null
    ) {
      // eslint-disable-next-line no-useless-return
      return;
    }

    // check whether content fits the screen and then toggle scroll state according to it
    const contentFitsScreen = (() => {
      if (point) {
        return (
          scrollViewContentHeight.current < scrollViewHeight.current - point
        );
      }
      return (
        scrollViewContentHeight.current < scrollViewHeight.current * percent
      );
    })();

    // content is less than the size of the screen, so we can safely disable scrolling
    if (scrollEnabled && contentFitsScreen) {
      setScrollEnabled(false);
    }

    // content is greater than the size of the screen, so enable scrolling
    if (!scrollEnabled && !contentFitsScreen) {
      setScrollEnabled(true);
    }
  }

  function onContentSizeChange(_w: number, h: number) {
    // update scroll-view content height
    scrollViewContentHeight.current = h;
    updateScrollState();
  }

  function onLayout(e: LayoutChangeEvent) {
    const { height } = e.nativeEvent.layout;

    // update scroll-view height
    scrollViewHeight.current = height;
    updateScrollState();
  }

  // update scroll-state on every render
  if (preset === 'auto') {
    updateScrollState();
  }

  return {
    scrollEnabled: preset === 'auto' ? scrollEnabled : true,
    onContentSizeChange,
    onLayout,
  };
}

function ScreenWithoutScrolling({
  style,
  contentContainerStyle,
  children,
}: ScreenProps) {
  const { styles } = useStyles(styleSheet);

  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, contentContainerStyle]}>{children}</View>
    </View>
  );
}

function ScreenWithScrolling(props: ScreenProps) {
  const {
    children,
    keyboardShouldPersistTaps = 'handled',
    contentContainerStyle,
    // eslint-disable-next-line no-shadow
    ScrollViewProps,
    style,
  } = props as ScrollScreenProps;
  const { styles } = useStyles(styleSheet);
  const ref = useRef<ScrollView>(null);

  const { scrollEnabled, onContentSizeChange, onLayout } = useAutoPreset(
    props as AutoScreenProps,
  );

  // Add native behavior of pressing the active tab to scroll to the top of the content
  // More info at: https://reactnavigation.org/docs/use-scroll-to-top/
  useScrollToTop(ref);

  return (
    <ScrollView
      {...{ keyboardShouldPersistTaps, scrollEnabled, ref }}
      {...ScrollViewProps}
      onLayout={e => {
        onLayout(e);
        ScrollViewProps?.onLayout?.(e);
      }}
      onContentSizeChange={(w: number, h: number) => {
        onContentSizeChange(w, h);
        ScrollViewProps?.onContentSizeChange?.(w, h);
      }}
      style={[styles.outer, ScrollViewProps?.style, style]}
      contentContainerStyle={[
        styles.inner,
        ScrollViewProps?.contentContainerStyle,
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

export function Screen({
  backgroundColor,
  // eslint-disable-next-line no-shadow
  KeyboardAvoidingViewProps,
  keyboardOffset = 0,
  safeAreaEdges,
  // eslint-disable-next-line no-shadow
  SafeAreaViewProps,
  // eslint-disable-next-line no-shadow
  preset,
  ...props
}: ScreenProps) {
  const Wrapper = safeAreaEdges?.length ? SafeAreaView : View;

  const { styles, theme } = useStyles(styleSheet);

  const colorScheme = useColorScheme();

  return (
    <Wrapper
      edges={safeAreaEdges}
      {...SafeAreaViewProps}
      style={[
        styles.safeArea,
        SafeAreaViewProps?.style,
        { backgroundColor: backgroundColor ?? theme.colors.screen },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        behavior={isIos ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
        {...KeyboardAvoidingViewProps}
        style={[styles.keyboardAvoidingView, KeyboardAvoidingViewProps?.style]}
      >
        {isNonScrolling(preset) ? (
          <ScreenWithoutScrolling {...props} />
        ) : (
          <ScreenWithScrolling {...props} />
        )}
      </KeyboardAvoidingView>
    </Wrapper>
  );
}

const styleSheet = createStyleSheet(theme => ({
  safeArea: {
    flex: 1,
    height: '100%',
    width: '100%',
    padding: theme.spacing.sm,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  outer: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  inner: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
}));
