import { memo, useCallback, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';

import { useMorphTabMotion } from '../hooks/use-morph-tab-motion';
import type { MorphTabProps } from '../types';
import { tabStyles as styles } from '../utils/tab-styles';

const MorphTab = memo(function MorphTab({
  active,
  colors,
  index,
  item,
  onPress,
}: MorphTabProps) {
  const [labelWidth, setLabelWidth] = useState(0);
  const motion = useMorphTabMotion(active, colors, labelWidth);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.ceil(event.nativeEvent.layout.width);
    if (width > 0) {
      setLabelWidth(currentWidth =>
        currentWidth === width ? currentWidth : width,
      );
    }
  }, []);

  const handlePress = useCallback(() => {
    onPress(item, index);
  }, [index, item, onPress]);

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole='button'
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      onPressIn={motion.hold}
      onPressOut={motion.release}
    >
      <Text
        numberOfLines={1}
        onLayout={handleLayout}
        style={[styles.tabLabel, styles.measureLabel]}
      >
        {item.label}
      </Text>

      <Animated.View style={[styles.tabMorph, motion.containerStyle]}>
        <Animated.View
          pointerEvents='none'
          style={[
            styles.holdCircle,
            { backgroundColor: colors.accent },
            motion.holdCircleStyle,
          ]}
        />
        <View style={styles.iconBox}>
          <Animated.View
            style={[
              styles.iconLayer,
              motion.iconInactiveStyle,
              motion.iconSqueezeStyle,
            ]}
          >
            {item.icon(false, colors.muted, 22)}
          </Animated.View>
          <Animated.View
            style={[
              styles.iconLayer,
              motion.iconActiveStyle,
              motion.iconSqueezeStyle,
            ]}
          >
            {item.icon(true, colors.foreground, 22)}
          </Animated.View>
        </View>
        <Animated.View style={[styles.tabLabelWrap, motion.labelStyle]}>
          <Text
            ellipsizeMode='clip'
            numberOfLines={1}
            style={[
              styles.tabLabel,
              styles.fixedLabel,
              { color: colors.foreground, width: labelWidth },
            ]}
          >
            {item.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

export { MorphTab };
