import { SafeAreaViewFixed } from '@app/components/SafeAreaViewFixed';
import { useEffect } from 'react';
import { useWindowDimensions, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { FlashList } from '../../FlashList';
import { Typography } from '../../Typography';

const Shimmer = ({ style }: { style: ViewStyle }) => {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    const startAnimation = () => {
      translateX.value = withRepeat(
        withSequence(
          withTiming(100, { duration: 2000 }),
          withTiming(-100, { duration: 2000 }),
        ),
        -1,
        false,
      );
    };

    runOnJS(startAnimation)();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Make sure the style calculation runs on the UI thread
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${translateX.value}%` }],
    };
  });

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            transform: [{ skewX: '-15deg' }],
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

export function ChatSkeleton() {
  const { width, height } = useWindowDimensions();

  const chatWidth = width;
  const chatHeight = height * 0.6;
  return (
    <SafeAreaViewFixed style={styles.safeArea}>
      <Typography style={styles.header} size="sm">
        CHAT
      </Typography>
      <View
        style={[styles.chatContainer, { width: chatWidth, height: chatHeight }]}
      >
        <FlashList
          estimatedItemSize={20}
          data={new Array(20)}
          renderItem={({ index }) => (
            <View key={index} style={styles.skeletonMessageContainer}>
              <Shimmer style={styles.skeletonAvatar} />
              <View style={styles.skeletonContent}>
                <Shimmer style={styles.skeletonUsername} />
                <Shimmer style={styles.skeletonMessage} />
              </View>
            </View>
          )}
        />
      </View>
      <View style={styles.inputContainer} />
    </SafeAreaViewFixed>
  );
}

const styles = StyleSheet.create(theme => ({
  header: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  chatContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skeletonMessageContainer: {
    flexDirection: 'row',
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2d',
  },
  skeletonAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d2d2d',
  },
  skeletonContent: {
    flex: 1,
    gap: 4,
  },
  skeletonUsername: {
    width: 80,
    height: 14,
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
  },
  skeletonMessage: {
    width: '50%',
    height: 14,
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
  },
  skeletonInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#2d2d2d',
    borderRadius: 18,
  },
}));
