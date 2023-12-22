/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-shadow */
/* eslint-disable no-console */
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Heading from '../../components/Heading';
import Image from '../../components/Image';
import Tags from '../../components/Tags';
import { useAuthContext } from '../../context/AuthContext';
import tmiClient from '../../lib/tmi';
import { StreamStackParamList } from '../../navigation/Stream/StreamStack';
import twitchService, {
  Stream,
  UserInfoResponse,
} from '../../services/twitchService';
import colors from '../../styles/colors';
import viewFormatter from '../../utils/viewFormatter';

const LiveStreamScreen = () => {
  const route = useRoute<RouteProp<StreamStackParamList>>();
  const navigation = useNavigation();
  const [liveStream, setLiveStream] = useState<Stream | null>();
  const [videoUrl, setVideoUrl] = useState('');
  const [broadcasterImage, setBroadcasterImage] = useState<string>();
  const [offlineUser, setOfflineUser] = useState<UserInfoResponse>();
  const { auth, user } = useAuthContext();
  const isOffline = offlineUser !== undefined;
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const messageRef = useRef<FlatList<string>>(null);
  const [scrollPaused, setScrollPaused] = useState(false);

  const getUserProfilePicture = async (id: string) => {
    const res = await twitchService.getUserImage(id);
    setBroadcasterImage(res);
  };

  const client = tmiClient(route.params.id, auth?.token?.accessToken, user?.id);

  const join = async () => {
    try {
      await client.connect();
      await client.join(route.params.id);
    } catch (e) {
      console.error(e);
    }
  };

  const disconnectBeforeLeaving = async () => {
    try {
      client.disconnect();
      client.removeAllListeners();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    navigation.addListener('blur', disconnectBeforeLeaving);
  }, [navigation]);
  // Adding side effect on component mount to disconnect from chat when leaving the screen

  // client.on('message', (channel, tags, message, self) => {
  //   // "Alca: Hello, World!"
  //   console.log('------------------------------------');
  //   console.log(`${tags['display-name']}: ${message}`);
  //   console.log('------------------------------------');
  // });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  client.on('message', (channel, tags, message, self) => {
    if (self) {
      return;
    }
    setMessages(prev => [...prev, `${tags['display-name']}: ${message}`]);
  });

  const renderChatMessage = (message: string) => {
    return (
      <Text style={{ color: colors.gray, textAlign: 'left' }}>{message}</Text>
    );
  };

  client.on('disconnected', reason => {
    console.log(`Disconnected: ${reason}`);
  });

  const fetchStream = async () => {
    const stream = await twitchService.getStream(route.params.id);
    if (!stream) {
      const res = await twitchService.getUser(route.params.id);
      setOfflineUser(res);
    }
    setLiveStream(stream);
    getUserProfilePicture(route.params.id);
    setVideoUrl(
      `https://player.twitch.tv?channel=${stream?.user_login}&muted=false&controls=true&parent=foam`,
    );
  };

  useMemo(() => {
    join();
  }, [liveStream]);

  useEffect(() => {
    fetchStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getUserProfilePicture(route.params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStream]);

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
              allowsInlineMediaPlayback
              scalesPageToFit
              javaScriptCanOpenWindowsAutomatically
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScript={`
                document.getElementsByTagName("video")[0].addEventListener("pause", () => VideoPause.postMessage("video paused"));
                document.getElementsByTagName("video")[0].addEventListener("playing", () => VideoPlaying.postMessage("video playing"));
                `}
              bounces={false}
              onMessage={event => {
                console.log('Event is', event.nativeEvent.data);

                if (event.nativeEvent.data === 'video paused') {
                  console.log('Video paused');
                  console.log('setting paused to true');
                } else if (event.nativeEvent.data === 'video playing') {
                  console.log('Video playing');
                  console.log('setting paused to false');
                }
              }}
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

            <Heading fontSize={20} paddingBottom={7}>
              {isOffline ? offlineUser?.display_name : liveStream?.user_name}
            </Heading>
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
          <Tags tags={liveStream?.tags ?? []} marginTop={8} marginBottom={8} />
        </View>
      </View>

      <View style={styles.chat}>
        <Text style={{ color: colors.gray }}>CHAT</Text>
        <FlatList
          data={messages}
          ref={messageRef}
          renderItem={({ item }) => renderChatMessage(item)}
          onContentSizeChange={() => {
            if (!scrollPaused) {
              messageRef.current?.scrollToEnd({ animated: false });
            }
          }}
          onScrollEndDrag={() => {
            setScrollPaused(false);
          }}
        />
      </View>
      <KeyboardAvoidingView>
        <TextInput
          style={styles.input}
          placeholder="useless placeholder"
          keyboardType="numeric"
          onChangeText={text => setMessage(text)}
        />
        <Button
          title="Send"
          onPress={async () => {
            client.say(route.params.id, message as string);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default LiveStreamScreen;

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    color: colors.gray,
    border: 'solid',
    borderBottomColor: colors.gray,
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    backgroundColor: colors.primary,
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
