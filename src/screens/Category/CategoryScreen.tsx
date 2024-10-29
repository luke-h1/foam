import LiveStreamCard from '@app/components/LiveStreamCard';
import Text from '@app/components/Text';
import { useAppTheme } from '@app/context/ThemeContext';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '@app/navigation/Category/CategoryStack';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { ThemedStyle } from '@app/theme';
import { useQueries } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  FlatList,
  ImageStyle,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CategoryScreen({
  route,
}: CategoryStackScreenProps<CategoryRoutes.Category>) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { theme, themed } = useAppTheme();

  // Animated header on scroll
  const transitionY = useSharedValue<number>(0);

  const scrollHandler = useAnimatedScrollHandler(event => {
    transitionY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            transitionY.value,
            [-120, 0, 150],
            [-90, 0, 120],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            transitionY.value,
            [-120, 0],
            [1.4, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(transitionY.value, [0, 100], [1, 0.6]),
    };
  });

  const [categoryQueryResult, streamsByCategoryQueryResult] = useQueries({
    queries: [
      twitchQueries.getCategory(id),
      twitchQueries.getStreamsByCategory(id),
    ],
  });
  const {
    data: category,
    isLoading: isLoadingCategory,
    isError: isErrorCategory,
  } = categoryQueryResult;

  const {
    data: streams,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
  } = streamsByCategoryQueryResult;

  if (isLoadingCategory || isLoadingStreams) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          flexDirection: 'column',
        }}
      >
        <View>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isErrorCategory || isErrorStreams) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          flexDirection: 'column',
        }}
      >
        <View>
          <Text>Something went wrong</Text>
        </View>
      </SafeAreaView>
    );
  }

  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

  return (
    <SafeAreaView style={themed($safeArea)}>
      <View style={styles.container}>
        <AnimatedScrollView
          style={styles.container}
          onScroll={scrollHandler}
          scrollEventThrottle={8}
          contentContainerStyle={[
            themed($contentContainer),
            {
              paddingBottom: insets.bottom + theme.spacing.xl,
            },
          ]}
        >
          <Animated.View style={headerStyle}>
            <View style={themed($headerContent)}>
              <Image
                source={{
                  uri: category?.box_art_url
                    .replace('{width}', '600')
                    .replace('{height}', '1080'),
                }}
                style={styles.categoryLogo}
              />
              <Text size="lg" style={themed($categoryTitle)}>
                {category?.name}
              </Text>
            </View>
          </Animated.View>
          <View style={themed($content)}>
            <FlatList<Stream>
              data={streams}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <LiveStreamCard stream={item} />}
            />
          </View>
        </AnimatedScrollView>
      </View>
    </SafeAreaView>
  );
}

const $safeArea: ThemedStyle<ViewStyle> = theme => ({
  flex: 1,
  backgroundColor: theme.colors.text,
});

const $headerContent: ThemedStyle<ViewStyle> = theme => ({
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  paddingLeft: theme.spacing.lg,
  display: 'flex',
});

const $contentContainer: ThemedStyle<ViewStyle> = theme => ({
  borderBottomRightRadius: theme.spacing.md,
  borderBottomLeftRadius: theme.spacing.md,
});

const $categoryTitle: ThemedStyle<TextStyle> = theme => ({
  textAlign: 'center',
  marginLeft: theme.spacing.md,
  fontSize: 17,
  fontWeight: 'bold',
});

const $content: ThemedStyle<ViewStyle> = theme => ({
  paddingTop: theme.spacing.lg,
});

const styles = StyleSheet.create<{
  container: ViewStyle;
  categoryLogo: ImageStyle;
}>({
  container: {
    flex: 1,
  },
  categoryLogo: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
});
