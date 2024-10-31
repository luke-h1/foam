/* eslint-disable no-shadow */
import { StreamStackParamList } from '@app/navigation/Stream/StreamStack';
import twitchQueries from '@app/queries/twitchQueries';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  const navigation = useNavigation();

  const [isPlaying, setIsPlaying] = useState(true);

  const [streamQueryResult, userQueryResult, userProfilePictureQueryResult] =
    useQueries({
      queries: [
        twitchQueries.getStream(route.params.id),
        twitchQueries.getUser(route.params.id),
        twitchQueries.getUserImage(route.params.id),
      ],
    });

  const { data: stream, isLoading } = streamQueryResult;
  const { data: user, isLoading: userIsLoading } = userQueryResult;
  const { data: userProfilePicture } = userProfilePictureQueryResult;

  const { width } = Dimensions.get('window');

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      setIsPlaying(false);
    });

    return unsubscribe;
  }, [navigation]);

  if (isLoading || userIsLoading) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
          }}
        >
          <Text>loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {stream && isPlaying && (
          <WebView
            source={{
              uri: isPlaying
                ? `https://player.twitch.tv?channel=${stream?.user_login}&controls=true&parent=localhost&autoplay=true`
                : '',
            }}
            onHttpError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              // eslint-disable-next-line no-console
              console.warn(
                'WebView received error status code: ',
                nativeEvent.statusCode,
              );
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
        )}

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
            {stream?.viewer_count && (
              <Text style={styles.videoViews}>
                {new Intl.NumberFormat('en-US').format(stream?.viewer_count)}{' '}
                viewers
              </Text>
            )}
          </View>
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
    fontSize: 14,
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
    fontSize: 12,
  },
  videoViews: {
    fontSize: 16,
    color: '#888',
  },
  controlsContainer: {
    padding: 10,
  },
});
