import { Typography } from '@app/components';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { useAppNavigation } from './useAppNavigation';
import { useTargetMeasurement } from './useTargetMeasurement';

interface Props {
  offsetY: SharedValue<number>;
  title: string;
}

export function useHeader({ offsetY, title }: Props) {
  const navigation = useAppNavigation();
  const headerHeight = useHeaderHeight();

  const {
    targetRef: triggerRef,
    onTargetLayout: onLayout,
    measurement: triggerMeasurement,
  } = useTargetMeasurement();

  const rightStyle = useAnimatedStyle(() => {
    if (triggerMeasurement.value === null) {
      return {
        opacity: 0,
      };
    }

    const triggerHeight = triggerMeasurement.value.height;
    const triggerPageY = triggerMeasurement.value.pageY;

    const scrollDistance = triggerPageY - headerHeight;

    return {
      opacity: 1,
      transform: [
        {
          translateY: interpolate(
            offsetY.value,
            [scrollDistance, scrollDistance + triggerHeight],
            [30, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  useEffect(() => {
    navigation.setOptions({
      // temp fix for headerTitleAlign: 'center' not working on Android
      headerLeft: () => <View style={styles.headerLeft} />,
      headerTitle: () => (
        <View style={styles.titleContainer}>
          <Animated.View style={rightStyle}>
            <Typography style={styles.titleText}>{title}</Typography>
          </Animated.View>
        </View>
      ),
    });
  }, [navigation, rightStyle, title]);

  return { triggerRef, onLayout };
}

const styles = StyleSheet.create(theme => ({
  headerLeft: {
    width: 48,
  },
  titleContainer: {
    paddingVertical: theme.spacing.lg,
    overflow: 'hidden',
  },
  titleText: {
    fontSize: theme.font.fontSize.md,
    textAlign: 'center',
  },
}));
