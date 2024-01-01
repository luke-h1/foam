import { RouteProp, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { H5 } from 'tamagui';
import Image from '../../components/Image';
import Tags from '../../components/Tags';
import Chat from '../../components/ui/Chat/Chat';
import { StreamStackParamList } from '../../navigation/Stream/StreamStack';
import twitchService, {
  Stream,
  UserInfoResponse,
} from '../../services/twitchService';
import colors from '../../styles/colors';
import viewFormatter from '../../utils/viewFormatter';

const LiveStreamScreen = () => {
  const route = useRoute<RouteProp<StreamStackParamList>>();
  const [liveStream, setLiveStream] = useState<Stream | null>();
  const [videoUrl, setVideoUrl] = useState('');
  const [broadcasterImage, setBroadcasterImage] = useState<string>();
  const [offlineUser, setOfflineUser] = useState<UserInfoResponse>();
  const isOffline = offlineUser !== undefined;

  const getUserProfilePicture = async (id: string) => {
    const res = await twitchService.getUserImage(id);
    setBroadcasterImage(res);
  };

  const fetchStream = async () => {
    const stream = await twitchService.getStream(route.params.id);
    if (!stream) {
      const res = await twitchService.getUser(route.params.id);
      setOfflineUser(res);
    }
    setLiveStream(stream);
    getUserProfilePicture(route.params.id);
    // todo - set controls to false and fire JS messages to the iframe to pause and play the video
    setVideoUrl(
      `https://player.twitch.tv?channel=${stream?.user_login}&controls=true&parent=localhost&autoplay=true`,
    );
  };

  useEffect(() => {
    fetchStream();
    getUserProfilePicture(route.params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View
        style={{
          aspectRatio: 16 / 9,
          width: Dimensions.get('window').width,
        }}
      >
        {isOffline ? (
          <Image
            source={{ uri: offlineUser?.offline_image_url }}
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height / 3.6,
            }}
          />
        ) : (
          <View
            style={{
              aspectRatio: 16 / 9,
              width: Dimensions.get('window').width,
            }}
          >
            <WebView
              source={{ uri: videoUrl }}
              style={[styles.video]}
              javaScriptEnabled
              originWhitelist={['https://']}
              allowsInlineMediaPlayback
              javaScriptCanOpenWindowsAutomatically
            />
          </View>
        )}
      </View>

      <View style={styles.streamInfo}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Image
              source={{ uri: broadcasterImage }}
              style={styles.image}
              aria-label={`Go to ${liveStream?.user_name}'s profile`}
            />

            <H5 fontSize={20} paddingBottom={7}>
              {isOffline ? offlineUser?.display_name : liveStream?.user_name}
            </H5>
          </View>

          <Text style={{ color: colors.gray, marginBottom: 5 }}>
            {liveStream?.title ?? 'Offline'}
          </Text>
          {!isOffline ? (
            <Text style={{ color: colors.gray, alignItems: 'center' }}>
              Playing{' '}
              <Text style={{ color: colors.purple }}>
                {liveStream?.game_name}
              </Text>{' '}
              <Text style={{ color: colors.gray }}>
                for{' '}
                <Text style={{ color: colors.purple }}>
                  {viewFormatter(liveStream?.viewer_count as number, 1)}{' '}
                </Text>
                <Text style={{ color: colors.gray }}>viewers</Text>
              </Text>
            </Text>
          ) : null}
          <Tags tags={liveStream?.tags ?? []} />
        </View>
      </View>

      <View style={styles.chat}>
        <Text style={{ color: colors.gray }}>CHAT</Text>
        {liveStream?.user_name && (
          <Chat channels={[liveStream?.user_name] as string[]} />
        )}
      </View>
    </SafeAreaView>
  );
};
export default LiveStreamScreen;

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 0.75,
    borderRadius: 8,
    padding: 10,
  },
  wrapper: {
    flex: 1,
    display: 'flex',
  },
  video: {
    width,
    height: height / 3.6,
    color: colors.gray,
  },
  chat: {
    marginTop: 20,
    padding: 7,
    maxHeight: 300,
  },
  innerChat: {
    height: height / 2,
    width: width - 20,
    borderRadius: 10,
    padding: 10,
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 10,
    paddingRight: 10,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
});
