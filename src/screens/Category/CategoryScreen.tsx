import LiveStreamCard from '@app/components/LiveStreamCard';
import ThemedText from '@app/components/ThemedText';
import ThemedView from '@app/components/ThemedView';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '@app/navigation/Category/CategoryStack';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import theme from '@app/styles/theme';
import { useQueries } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  FlatList,
  ImageStyle,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
    <SafeAreaView style={styles.safeArea}>
      <ThemedView
        style={styles.container}
        dark={theme.color.darkBlue}
        light={theme.color.white}
      >
        <AnimatedScrollView
          style={styles.container}
          onScroll={scrollHandler}
          scrollEventThrottle={8}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom: insets.bottom + theme.spacing.xl,
            },
          ]}
        >
          <ThemedView animated style={[styles.header, headerStyle]}>
            <View style={styles.headerContent}>
              <Image
                source={{
                  uri: category?.box_art_url
                    .replace('{width}', '600')
                    .replace('{height}', '1080'),
                }}
                style={styles.categoryLogo}
              />
              <ThemedText
                fontWeight="bold"
                fontSize={24}
                style={styles.categoryTitle}
              >
                {category?.name}
              </ThemedText>
            </View>
          </ThemedView>
          <ThemedView style={styles.content}>
            <FlatList<Stream>
              data={streams}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <LiveStreamCard stream={item} />}
            />
          </ThemedView>
        </AnimatedScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  safeArea: ViewStyle;
  container: ViewStyle;
  contentContainer: ViewStyle;
  header: ViewStyle;
  headerContent: ViewStyle;
  categoryLogo: ImageStyle;
  categoryTitle: TextStyle;
  content: ViewStyle;
}>({
  safeArea: {
    flex: 1,
    backgroundColor: theme.color.white, // Adjust the background color as needed
  },
  container: {
    flex: 1,
  },
  header: {},
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: theme.spacing.lg,
    display: 'flex',
  },
  contentContainer: {
    borderBottomRightRadius: theme.borderradii.lg,
    borderBottomLeftRadius: theme.borderradii.lg,
  },
  categoryTitle: {
    textAlign: 'center',
    marginLeft: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  categoryLogo: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  content: {
    paddingTop: theme.spacing.lg,
    // paddingHorizontal: theme.spacing.lg,
  },
});
