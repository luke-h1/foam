import { Spinner, Chat, Screen, Typography, EmptyState } from '@app/components';
import { StreamStackScreenProps } from '@app/navigators';
import { twitchQueries } from '@app/queries/twitchQueries';
import { useQueries } from '@tanstack/react-query';
import { FC } from 'react';
import {
  View,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import WebView from 'react-native-webview';

export const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
  route: { params },
}) => {
  const { styles } = useStyles(stylesheet);
  const [streamQueryResult, userQueryResult, userProfilePictureQueryResult] =
    useQueries({
      queries: [
        twitchQueries.getStream(params.id),
        twitchQueries.getUser(params.id),
        twitchQueries.getUserImage(params.id),
      ],
    });

  const {
    data: stream,
    isLoading: isStreamLoading,
    refetch: refetchStream,
  } = streamQueryResult;
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = userQueryResult;
  const {
    data: userProfilePicture,
    isLoading: isUserProfilePictureLoading,
    refetch: refetchUserProfilePicture,
  } = userProfilePictureQueryResult;

  const { width } = Dimensions.get('window');

  if (isStreamLoading || isUserLoading || isUserProfilePictureLoading) {
    return <Spinner />;
  }

  const handleRefresh = async () => {
    await Promise.all([
      refetchStream(),
      refetchUser(),
      refetchUserProfilePicture(),
    ]);
  };

  if (!stream) {
    return (
      <Screen>
        <EmptyState
          content="Failed to fetch stream."
          heading="No Stream found"
          buttonOnPress={() => handleRefresh()}
        />
      </Screen>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <WebView
          source={{
            uri: `https://player.twitch.tv?channel=${stream?.user_login}&controls=true&parent=localhost&autoplay=true`,
          }}
          style={[
            styles.webView,
            {
              width,
              height: width * (9 / 16),
            },
          ]}
          allowsInlineMediaPlayback
        />
        <View style={styles.videoDetails}>
          <View style={styles.videoTitleContainer}>
            <Typography style={styles.videoTitle} size="xs">
              {stream?.title}
            </Typography>
            <Typography style={styles.videoTitle} size="xs">
              {stream?.game_name}
            </Typography>
          </View>
          <View style={styles.videoMetadata}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: userProfilePicture }}
                style={styles.avatar}
              />
              <Typography style={styles.videoUser}>
                {user?.display_name}
              </Typography>
            </View>
            <Typography style={styles.videoViews}>
              {new Intl.NumberFormat('en-US').format(
                stream?.viewer_count as number,
              )}{' '}
              viewers
            </Typography>
          </View>
        </View>
        <View style={styles.chatContainer}>
          <Chat
            channelId={user?.id as string}
            channelName={stream?.user_login as string}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  webView: {
    overflow: 'hidden',
  },
  videoDetails: {
    padding: 10,
    width: '100%',
  },
  videoTitleContainer: {
    marginBottom: 10,
    flexDirection: 'column',
  },
  videoTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
  },
  videoMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  videoUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoViews: {
    fontSize: 16,
    color: theme.colors.border,
  },
  chatContainer: {
    padding: 2,
    maxHeight: 300,
  },
}));
