/* eslint-disable no-shadow */
import Chat from '@app/components/Chat';
import { StreamStackParamList } from '@app/navigation/Stream/StreamStack';
import twitchQueries from '@app/queries/twitchQueries';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQueries } from '@tanstack/react-query';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import WebView from 'react-native-webview';

export default function LiveStreamScreen() {
  const route = useRoute<RouteProp<StreamStackParamList>>();

  const [streamQueryResult, userQueryResult, userProfilePictureQueryResult] =
    useQueries({
      queries: [
        twitchQueries.getStream(route.params.id),
        twitchQueries.getUser(route.params.id),
        twitchQueries.getUserImage(route.params.id),
      ],
    });

  const { data: stream, isLoading: isStreamLoading } = streamQueryResult;
  const { data: user, isLoading: isUserLoading } = userQueryResult;
  const { data: userProfilePicture } = userProfilePictureQueryResult;

  const { width } = Dimensions.get('window');

  if (isStreamLoading || isUserLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingView}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stream) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingView}>
          <Text>No stream available</Text>
        </View>
      </SafeAreaView>
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
              width, // Adjust width based on screen size
              height: width * (9 / 16), // Maintain 16:9 aspect ratio
            },
          ]}
          allowsInlineMediaPlayback
        />
        <View style={styles.videoDetails}>
          <View style={styles.videoTitleContainer}>
            <Text style={styles.videoTitle}>{stream?.title}</Text>
          </View>
          <View style={styles.videoMetadata}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: userProfilePicture }}
                style={styles.avatar}
              />
              <Text style={styles.videoUser}>{user?.display_name}</Text>
            </View>
            <Text style={styles.videoViews}>
              {new Intl.NumberFormat('en-US').format(
                stream?.viewer_count as number,
              )}{' '}
              viewers
            </Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingView: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    color: '#888',
  },
  chatContainer: {
    padding: 2,
    maxHeight: 300, // Restrict the height of the chat container
  },
  controlsContainer: {
    padding: 10,
  },
});
