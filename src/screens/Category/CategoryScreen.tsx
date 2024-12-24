import LiveStreamCard from '@app/components/LiveStreamCard';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import { Text } from '@app/components/ui/Text';
import useHeader from '@app/hooks/useHeader';
import { AppStackParamList } from '@app/navigators';
import BackButton from '@app/navigators/BackButton';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueries } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { FC, useState } from 'react';
import {
  FlatList,
  ImageStyle,
  RefreshControl,
  ScrollView,
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

const CategoryScreen: FC<StackScreenProps<AppStackParamList, 'Category'>> = ({
  route: { params },
}) => {
  const { id } = params;
  const transitionY = useSharedValue<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const scrollHandler = useAnimatedScrollHandler(event => {
    transitionY.value = event.contentOffset.y;
  });

  useHeader({
    title: 'Categories',
    LeftActionComponent: <BackButton />,
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
    refetch: refetchStreamsByCategory,
  } = streamsByCategoryQueryResult;

  if (isLoadingCategory || isLoadingStreams || refreshing) {
    return <Spinner />;
  }

  if (isErrorCategory || isErrorStreams) {
    return (
      <EmptyState
        content="Failed to fetch categories"
        heading="No Categories"
        buttonOnPress={() => refetchStreamsByCategory()}
      />
    );
  }

  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchStreamsByCategory();
    setRefreshing(false);
  };

  return (
    <Screen
      preset="scroll"
      ScrollViewProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ),
      }}
    >
      <View style={$container}>
        <AnimatedScrollView
          style={$container}
          onScroll={scrollHandler}
          scrollEventThrottle={8}
        >
          <View style={headerStyle}>
            <View style={$headerContent}>
              <Image
                source={{
                  uri: category?.box_art_url
                    .replace('{width}', '600')
                    .replace('{height}', '1080'),
                }}
                style={$categoryLogo}
              />
              <Text style={$categoryTitle}>{category?.name}</Text>
            </View>
          </View>
          <View style={$content}>
            <FlatList<Stream>
              data={streams}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <LiveStreamCard stream={item} />}
            />
          </View>
        </AnimatedScrollView>
      </View>
    </Screen>
  );
};

export default CategoryScreen;

const $container: ViewStyle = {
  flex: 1,
};

const $headerContent: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  paddingLeft: spacing.large,
  display: 'flex',
};
const $categoryLogo: ImageStyle = {
  width: 100,
  height: 150,
  borderRadius: 10,
};
const $categoryTitle: TextStyle = {
  textAlign: 'center',
  marginLeft: spacing.medium,
  fontWeight: 'bold',
};
const $content: ViewStyle = {
  paddingTop: spacing.large,
  paddingHorizontal: spacing.large,
};
