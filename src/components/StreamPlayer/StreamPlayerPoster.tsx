import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { theme } from '@app/styles/themes';

import { Image } from '../Image/Image';
import { LoadingState } from '../LoadingState/LoadingState';

interface StreamPlayerPosterProps {
  /**
   * Stream thumbnail shown behind the spinner while the player loads. Sized to
   * match the live-stream card so it's an instant cache hit when arriving from
   * the stream list. Absent on VOD/clip - the spinner shows over black instead.
   */
  posterUrl?: string;
  visible: boolean;
}

const FADE_OUT_MS = 260;

export const StreamPlayerPoster = memo(function StreamPlayerPoster({
  posterUrl,
  visible,
}: StreamPlayerPosterProps) {
  // Stay mounted through the fade-out, then drop so LoadingState's withRepeat
  // spinner and the poster bitmap are not left idle for the watch session.
  const [rendered, setRendered] = useState(visible);
  const opacity = useSharedValue(visible ? 1 : 0);

  if (visible && !rendered) {
    setRendered(true);
  }

  useEffect(() => {
    if (visible) {
      opacity.set(1);
      return;
    }

    opacity.set(
      withTiming(0, { duration: FADE_OUT_MS }, finished => {
        if (finished) {
          scheduleOnRN(setRendered, false);
        }
      }),
    );
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  if (!rendered) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, styles.container, animatedStyle]}
    >
      {posterUrl ? (
        <Image
          source={posterUrl}
          contentFit='cover'
          transition={150}
          containerStyle={StyleSheet.absoluteFill}
          style={styles.image}
        />
      ) : null}
      <View style={styles.scrim} />
      <LoadingState style={styles.spinner} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colorBlack,
    justifyContent: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  spinner: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
});
