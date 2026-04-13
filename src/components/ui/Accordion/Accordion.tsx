import { Ionicons } from '@expo/vector-icons';
import { BlurView, type BlurViewProps } from 'expo-blur';
import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
} from 'expo-haptics';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LayoutChangeEvent,
  Platform,
  // eslint-disable-next-line no-restricted-imports
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AccordionThemes } from './presets';
import {
  AccordionContentProps,
  AccordionContextValue,
  AccordionItemProps,
  AccordionProps,
  AccordionTriggerProps,
} from './types';

const AnimatedBlurView =
  Animated.createAnimatedComponent<BlurViewProps>(BlurView);

const AccordionContext = createContext<AccordionContextValue | null>(null);

const AccordionItemContext = createContext<{
  value: string;
  isOpen: boolean;
  icon: 'chevron' | 'cross';
} | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion must be used within an AccordionContext');
  }
  return context;
};

const useAccordionItem = () => {
  const context = useContext(AccordionItemContext);
  if (!context)
    throw new Error(
      'Trigger and Content Accordion must be within an ItemContext',
    );
  return context;
};

interface IconProps {
  isOpen: boolean;
}

const ChevronIcon = ({ isOpen }: IconProps) => {
  const { theme } = useAccordion();
  const rotation = useSharedValue<number>(0);

  useEffect(() => {
    rotation.value = withTiming<number>(isOpen ? 1 : 0, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg`,
      },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="chevron-down" size={20} color={theme.iconColor} />
    </Animated.View>
  );
};

const CrossIcon = ({ isOpen }: IconProps) => {
  const { theme } = useAccordion();
  const topLineTranslate = useSharedValue<number>(0);
  const bottomLineTranslate = useSharedValue<number>(0);
  const middleLineOpacity = useSharedValue<number>(1);

  useEffect(() => {
    if (isOpen) {
      topLineTranslate.value = withTiming(6, { duration: 200 });
      bottomLineTranslate.value = withTiming(-6, { duration: 200 });
      middleLineOpacity.value = withTiming(0, { duration: 200 });
    }

    topLineTranslate.value = withTiming(0, { duration: 200 });
    bottomLineTranslate.value = withTiming(0, { duration: 200 });
    middleLineOpacity.value = withTiming(1, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const middleLineStyle = useAnimatedStyle(() => ({
    opacity: middleLineOpacity.value,
  }));

  const bottomLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomLineTranslate.value }],
  }));

  return (
    <View style={crossIconStyles.wrapper}>
      <Animated.View
        style={[crossIconStyles.topLine, { backgroundColor: theme.iconColor }]}
      />
      <Animated.View
        style={[
          crossIconStyles.middleLine,
          { backgroundColor: theme.iconColor },
          middleLineStyle,
        ]}
      />
      <Animated.View
        style={[
          crossIconStyles.bottomLine,
          { backgroundColor: theme.iconColor },
          bottomLineStyle,
        ]}
      />
    </View>
  );
};

const crossIconStyles = StyleSheet.create({
  bottomLine: {
    borderRadius: 1,
    height: 2,
    width: 16,
  },
  middleLine: {
    borderRadius: 1,
    height: 2,
    marginBottom: 4,
    width: 16,
  },
  topLine: {
    borderRadius: 1,
    height: 2,
    marginBottom: 4,
    width: 16,
  },
  wrapper: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
});

const Accordion = ({
  children,
  type = 'single',
  theme = AccordionThemes.dark,
  spacing = 0,
}: AccordionProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = useCallback(
    (id: string) => {
      setOpenItems(prev => {
        const newSet = new Set(prev);
        if (type === 'single') {
          if (newSet.has(id)) {
            newSet.clear();
          } else {
            newSet.clear();
            newSet.add(id);
          }
        } else if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    [type],
  );

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      openItems,
      toggleItem,
      theme,
      spacing,
    }),
    [openItems, spacing, theme, toggleItem],
  );

  const childArray = Children.toArray(children);

  const childWithProps = childArray.map((child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<AccordionItemProps>, {
        isLast: index === childArray.length - 1,
      });
    }
    return child;
  });

  return (
    <AccordionContext.Provider value={contextValue}>
      <View
        style={[
          styles.accordion,
          {
            backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
          },
        ]}
      >
        {childWithProps}
      </View>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({
  children,
  value,
  pop = false,
  icon = 'chevron',
  popScale = 1.02,
  isLast = false,
}: AccordionItemProps) => {
  const { openItems, theme, spacing } = useAccordion();
  const isOpen = openItems.has(value);
  const scale = useSharedValue<number>(1);

  const itemContextValue = useMemo(
    () => ({ value, isOpen, icon }),
    [icon, isOpen, value],
  );

  useEffect(() => {
    if (pop) {
      scale.value = withTiming(isOpen ? popScale : 1, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pop]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <Animated.View
        style={[
          styles.item,
          // eslint-disable-next-line react-native/no-inline-styles
          {
            borderBottomColor: theme.borderColor,
            borderBottomWidth: isLast ? 0 : 1,
            marginBottom: spacing,
          },
          pop && animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </AccordionItemContext.Provider>
  );
};

const AccordionTrigger = ({ children }: AccordionTriggerProps) => {
  const { toggleItem } = useAccordion();
  const { value, isOpen, icon } = useAccordionItem();
  const blurIntensity = useSharedValue(40);

  useEffect(() => {
    blurIntensity.value = withTiming(isOpen ? 20 : 40, {
      duration: 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onPress = useCallback(() => {
    toggleItem(value);
    if (Platform.OS === 'android') {
      void performAndroidHapticsAsync(AndroidHaptics.Clock_Tick);
    }
    void impactAsync(ImpactFeedbackStyle.Medium);
  }, [toggleItem, value]);

  return (
    <Pressable style={() => [styles.trigger]} onPress={onPress}>
      <View style={styles.triggerContent}>
        {children}
        {icon === 'chevron' ? (
          <ChevronIcon isOpen={isOpen} />
        ) : (
          <CrossIcon isOpen={isOpen} />
        )}
      </View>
    </Pressable>
  );
};

const AccordionContent = ({ children }: AccordionContentProps) => {
  const { isOpen } = useAccordionItem();
  const { theme } = useAccordion();
  const height = useSharedValue<number>(0);
  const opacity = useSharedValue<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [measured, setMeasured] = useState<boolean>(false);
  const blurIntensity = useSharedValue<number>(40);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      // eslint-disable-next-line no-shadow
      const { height } = e.nativeEvent.layout;

      if (height > 0 && !measured) {
        setContentHeight(height);
        setMeasured(true);
      }
    },
    [measured],
  );

  useEffect(() => {
    if (measured) {
      if (isOpen) {
        height.value = withTiming(contentHeight, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
      } else {
        height.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, measured, contentHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: measured ? opacity.value : 0,
    overflow: 'hidden',
  }));

  useEffect(() => {
    blurIntensity.value = withTiming(isOpen ? 0 : 20, {
      duration: 200,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const animatedAndroidBlurStyles = useAnimatedStyle(() => ({
    filter: [
      {
        blur: interpolate(blurIntensity.value, [0, 40], [0, 20]),
      },
    ],
  }));

  const animatedBlurProps = useAnimatedProps(() => ({
    intensity: blurIntensity.value,
  }));
  return (
    <>
      {!measured && (
        <View onLayout={onLayout} style={styles.measuringContainer}>
          <View style={styles.content}>{children}</View>
        </View>
      )}
      <Animated.View style={animatedStyle}>
        <View style={styles.contentWrapper}>
          <Animated.View
            style={[
              styles.content,
              Platform.OS === 'android' && animatedAndroidBlurStyles,
            ]}
          >
            {children}
          </Animated.View>
          {Platform.OS === 'ios' && (
            <AnimatedBlurView
              tint={
                theme.backgroundColor === '#18181b' ||
                theme.backgroundColor === '#0c4a6e' ||
                theme.backgroundColor === '#7c2d12'
                  ? 'dark'
                  : 'systemUltraThinMaterialDark'
              }
              animatedProps={animatedBlurProps}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                overflow: 'hidden',
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            />
          )}
        </View>
      </Animated.View>
    </>
  );
};

Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

const styles = StyleSheet.create({
  accordion: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  contentWrapper: {
    position: 'absolute',
    width: '100%',
  },
  item: {
    overflow: 'hidden',
  },

  measuringContainer: {
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
  },
  trigger: {
    overflow: 'hidden',
    position: 'relative',
  },
  triggerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});

export {
  AccordionThemes,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
