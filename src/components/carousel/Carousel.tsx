import React, {
  ComponentProps,
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { FlatList, ListRenderItemInfo } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useDeviceDimensions } from '../../hooks/useDeviceDimensions';
import { Flex } from '../Flex';
import { AnimatedIndicator } from './Indicator';

interface CarouselContextState {
  current: number;
  goToNext: () => void;
  goToPrev: () => void;
}

const CarouselContext = createContext<CarouselContextState | undefined>(
  undefined,
);

type CarouselProps = {
  slides: JSX.Element[];
} & Pick<ComponentProps<typeof Animated.FlatList>, 'scrollEnabled'>;

const Carousel = ({ slides, ...rest }: CarouselProps) => {
  const ref = useRef(null);
  const scroll = useSharedValue(0);
  const { fullWidth } = useDeviceDimensions();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scroll.value = event.contentOffset.x;
    },
  });

  const goToNext = useCallback(() => {
    // @ts-expect-error https://github.com/software-mansion/react-native-reanimated/issues/2976
    // eslint-disable-next-line no-underscore-dangle
    ref.current?._listRef.scrollRef.scrollTo({
      x: Math.ceil(scroll.value / fullWidth + 0.5) * fullWidth,
    });
  }, [fullWidth, scroll]);

  const goToPrev = useCallback(() => {
    // @ts-expect-error https://github.com/software-mansion/react-native-reanimated/issues/2976
    // eslint-disable-next-line no-underscore-dangle
    myRef.current?._listRef._scrollRef.scrollTo({
      x: Math.floor(scroll.value / fullWidth - 0.5) * fullWidth,
    });
  }, [fullWidth, scroll]);

  const contextState = useMemo(() => {
    return {
      goToNext,
      goToPrev,
      current: 0,
    };
  }, [goToNext, goToPrev]);

  return (
    <CarouselContext.Provider value={contextState}>
      <Flex grow gap="$spacing16" marginBottom="$spacing24">
        <AnimatedIndicator scroll={scroll} stepCount={slides.length} />
        <FlatList
          horizontal
          pagingEnabled
          data={slides}
          {...rest}
          ref={ref}
          renderItem={({
            item,
          }: ListRenderItemInfo<ReactNode>): JSX.Element => (
            <Flex
              centered
              grow
              padding="$spacing24"
              paddingTop="$none"
              width={fullWidth}
            >
              {item}
            </Flex>
          )}
          scrollEnabled
          scrollEventThrottle={32}
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
        />
      </Flex>
    </CarouselContext.Provider>
  );
};
export default Carousel;
