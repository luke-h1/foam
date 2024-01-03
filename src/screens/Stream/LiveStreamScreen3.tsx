import { useRoute, RouteProp } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { Dimensions, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import { Stack, Text } from 'tamagui';
import ArrowDownImage from '../../../assets/video/ic_arrow_down.png';
import PauseImage from '../../../assets/video/ic_media_pause_dark.png';
import PlayImage from '../../../assets/video/ic_media_play_dark.png';
import RotateImage from '../../../assets/video/ic_rotate.png';
import SettingsImage from '../../../assets/video/ic_settings.png';
import UserImage from '../../../assets/video/ic_user.png';
import Image from '../../components/Image';
import SafeAreaContainer from '../../components/ui/SafeAreaContainer';
import { StreamStackParamList } from '../../navigation/Stream/StreamStack';
import twitchService, {
  Stream,
  UserInfoResponse,
} from '../../services/twitchService';

const LiveStreamScreen3 = () => {
  const route = useRoute<RouteProp<StreamStackParamList>>();
  const [liveStream, setLiveStream] = useState<Stream | null>();
  const [videoUrl, setVideoUrl] = useState('');
  const [broadcasterImage, setBroadcasterImage] = useState<string>();
  const [offlineUser, setOfflineUser] = useState<UserInfoResponse>();
  const [isVideoActionsDisplayed, setVideoActionsDisplayed] = useState(true);
  const [isVideoPaused, setVideoPaused] = useState(false);

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

  const fetchDetails = async () => {
    await Promise.all([fetchStream(), getUserProfilePicture(route.params.id)]);
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaContainer>
      <Pressable onPress={() => console.log('video actions')}>
        <Stack
          aspectRatio={16 / 9}
          position="relative"
          justifyContent="space-between"
        >
          <WebView
            source={{ uri: videoUrl }}
            allowsInlineMediaPlayback
            style={{
              aspectRatio: 16 / 9,
              width: Dimensions.get('window').width,
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: 'purple',
            }}
          />
          {isVideoActionsDisplayed && (
            <>
              <Stack flexDirection="row" justifyContent="space-between">
                <Image
                  source={ArrowDownImage}
                  style={{
                    width: 28,
                    height: 28,
                  }}
                />
                <Image
                  source={SettingsImage}
                  style={{
                    width: 24,
                    height: 24,
                  }}
                />
              </Stack>
              <Pressable
                style={{ alignSelf: 'center' }}
                onPress={() => {
                  console.log('video paused');
                }}
              >
                {isVideoPaused ? (
                  <Image source={PlayImage} style={{ width: 52, height: 52 }} />
                ) : (
                  <Image
                    source={PauseImage}
                    style={{ width: 52, height: 52 }}
                  />
                )}
              </Pressable>
              <Stack justifyContent="space-between">
                <Stack flexDirection="row" alignItems="center">
                  <Stack>
                    <Text>{liveStream?.started_at}</Text>
                  </Stack>
                  <Stack
                    flexDirection="row"
                    alignItems="center"
                    backgroundColor="#000"
                  >
                    <Image
                      source={UserImage}
                      style={{ width: 20, height: 20 }}
                    />
                    <Text>{liveStream?.viewer_count}</Text>
                  </Stack>
                </Stack>
                <Stack flexDirection="row" alignItems="center">
                  {/* volumne */}
                  <Image
                    source={RotateImage}
                    style={{ width: 26, height: 26 }}
                  />
                </Stack>
              </Stack>
            </>
          )}
        </Stack>
      </Pressable>
      <Stack flex={1}>
        <Stack
          flexDirection="row"
          justifyContent="space-between"
          borderBottomWidth={1}
          style={{
            visibility: isVideoActionsDisplayed ? 'visible' : 'hidden',
          }}
        >
          <Image
            source={{ uri: broadcasterImage }}
            style={{
              width: 32,
              height: 32,
            }}
          />
          <Stack flex={1}>
            <Text fontSize={18}>
              {liveStream?.user_name ?? offlineUser?.display_name}
            </Text>
            <Text>{liveStream?.title ?? null}</Text>
            <Text>{liveStream?.game_name ?? null}</Text>
            <Stack flexDirection="row">{/* tags */}</Stack>
          </Stack>
        </Stack>
        <Stack flex={1}>
          <Text>Chat</Text>
        </Stack>
      </Stack>
    </SafeAreaContainer>
  );
};
export default LiveStreamScreen3;
