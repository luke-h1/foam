import Chat from '@app/components/Chat/Chat';
import Image from '@app/components/Image';
import Main from '@app/components/Main';
import SafeAreaContainer from '@app/components/SafeAreaContainer';
import Seperator from '@app/components/Seperator';
import Tags from '@app/components/Tags';
import { Text } from '@app/components/Text';
import Spinner from '@app/components/loading/Spinner';
import useIsLandscape from '@app/hooks/useIsLandscape';
import { StreamStackParamList } from '@app/navigation/Stream/StreamStack';
import twitchQueries from '@app/queries/twitchQueries';
import truncate from '@app/utils/truncate';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQueries } from '@tanstack/react-query';
import { Dimensions, SafeAreaView } from 'react-native';
import WebView from 'react-native-webview';
import { Stack, YStack } from 'tamagui';

const LiveStreamScreen = () => {
  const route = useRoute<RouteProp<StreamStackParamList>>();
  const { landscape } = useIsLandscape();

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

  if (isLoading || userIsLoading) {
    return (
      <SafeAreaView>
        <Main display="flex" flexDirection="row" flex={1}>
          <Spinner size={50} />
        </Main>
      </SafeAreaView>
    );
  }

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
          {stream ? (
            <WebView
              source={{
                uri: `https://player.twitch.tv?channel=${stream?.user_login}&controls=true&parent=localhost&autoplay=true`,
              }}
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
              source={{ uri: user?.offline_image_url }}
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
              source={{ uri: userProfilePicture }}
              style={{ width: 35, height: 35, borderRadius: 14 }}
            />
            <Text marginLeft={4}>
              {stream?.user_name ?? user?.display_name}
            </Text>
            <Stack marginLeft={8} marginTop={5} flexWrap="wrap">
              {stream?.title && (
                <Text wordWrap="break-word">{truncate(stream?.title, 40)}</Text>
              )}
              {stream?.game_name && (
                <Text marginTop={4}>{stream?.game_name}</Text>
              )}
              {stream?.tags && <Tags tags={stream?.tags} />}
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
          {stream && stream.user_id ? (
            <Chat
              channels={[route.params.id]}
              twitchChannelId={stream.user_id}
            />
          ) : (
            user && (
              <Chat
                channels={[user?.display_name as string]}
                twitchChannelId={user?.id as string}
              />
            )
          )}
        </Stack>
      </Main>
    </SafeAreaContainer>
  );
};
export default LiveStreamScreen;
