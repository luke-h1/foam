import { useRoute, RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import WebView from 'react-native-webview';
import { H5, Stack, Text, YStack } from 'tamagui';
import Image from '../../components/Image';
import Seperator from '../../components/Seperator';
import Tags from '../../components/Tags';
import Chat from '../../components/ui/Chat/Chat';
import Main from '../../components/ui/Main';
import SafeAreaContainer from '../../components/ui/SafeAreaContainer';
import useIsLandscape from '../../hooks/useIsLandscape';
import { StreamStackParamList } from '../../navigation/Stream/StreamStack';
import twitchService, {
  Stream,
  UserInfoResponse,
} from '../../services/twitchService';
import truncate from '../../utils/truncate';

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
    await getUserProfilePicture(route.params.id);
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

  const { landscape } = useIsLandscape();

  return (
    <SafeAreaContainer>
      <Main
        display="flex"
        flexDirection={landscape ? 'row' : 'column'}
        margin={0}
        padding={0}
      >
        {/* video and video details */}
        <YStack flex={landscape ? 2 : 3}>
          {!isOffline ? (
            <WebView
              source={{ uri: videoUrl }}
              onHttpError={syntheticEvent => {
                const { nativeEvent } = syntheticEvent;
                // eslint-disable-next-line no-console
                console.warn(
                  'WebView received error status code: ',
                  nativeEvent.statusCode,
                );
              }}
              style={{
                flex: 1,
              }}
              allowsInlineMediaPlayback
            />
          ) : (
            <Image
              source={{ uri: offlineUser.offline_image_url }}
              style={{
                width: 500,
                height: 200,
              }}
            />
          )}

          {/* stream details */}
          <Stack
            flexDirection={landscape ? 'row' : 'column'}
            justifyContent="flex-start"
            alignItems="flex-start"
            padding={4}
          >
            <Image
              source={{ uri: broadcasterImage }}
              style={{ width: 35, height: 35, borderRadius: 14 }}
            />
            <H5 marginLeft={4}>
              {liveStream?.user_name ?? offlineUser?.display_name}
            </H5>
            <Stack marginLeft={8} marginTop={5} flexWrap="wrap">
              {liveStream?.title && (
                <Text wordWrap="break-word">
                  {truncate(liveStream?.title, 40)}
                </Text>
              )}
              {liveStream?.game_name && (
                <Text marginTop={4}>{liveStream?.game_name}</Text>
              )}
              {liveStream?.tags && <Tags tags={liveStream?.tags} />}
            </Stack>
          </Stack>
          <Seperator />
        </YStack>
        <Stack
          height={400}
          flex={landscape ? 1 : 2}
          maxHeight={Dimensions.get('window').height - 10}
          width={landscape ? 200 : Dimensions.get('window').width}
        >
          {liveStream?.user_name && <Chat channels={[liveStream?.user_name]} />}
        </Stack>
      </Main>
    </SafeAreaContainer>
  );
};
export default LiveStreamScreen;
