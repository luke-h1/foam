import { Image } from '@app/components/Image/Image';
import { DEFAULT_BLURHASH } from '@app/components/ImageZoomView/constants';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useThemeColor } from '@app/hooks/useThemeColor';
import type { PropsWithChildren } from 'react';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

const HEADER_HEIGHT = 420;

type ParallaxHeroProps = PropsWithChildren<{
  imageSource: string | { uri: string } | number;
  title: string;
  shortDescription: string;
  imageBlurhash?: string;
}>;

export function ParallaxHero({
  children,
  imageSource,
  title,
  shortDescription,
  imageBlurhash,
}: ParallaxHeroProps) {
  const backgroundColor = useThemeColor('background');
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  useScrollToTop(scrollRef as unknown as RefObject<Animated.ScrollView>);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY =
      scrollOffset.value <= 0
        ? interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0],
            [-HEADER_HEIGHT / 2, 0],
          )
        : 0;
    const scale =
      scrollOffset.value <= 0
        ? interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0], [2, 1])
        : 1;

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholder={imageBlurhash ?? DEFAULT_BLURHASH}
            source={imageSource}
            style={styles.headerImage}
            transition={1000}
          />
        </Animated.View>
        <View
          style={[
            styles.headerContainer,
            {
              experimental_backgroundImage: `linear-gradient(to bottom, transparent, ${backgroundColor})`,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Text type="4xl" weight="bold">
              {title}
            </Text>
            <Text style={styles.description} type="default" weight="normal">
              {shortDescription}
            </Text>
          </View>
        </View>
        {children}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  description: {
    opacity: 0.7,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    position: 'absolute',
    width: '100%',
  },
  headerContent: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    width: '100%',
  },
  headerImage: {
    height: HEADER_HEIGHT,
    width: '100%',
  },
});
