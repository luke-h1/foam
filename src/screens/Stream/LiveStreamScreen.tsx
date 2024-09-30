import Chat from '@app/components/Chat/Chat';
import Image from '@app/components/Image';
import SafeAreaContainer from '@app/components/SafeAreaContainer';
import Seperator from '@app/components/Seperator';
import Tags from '@app/components/Tags';
import useIsLandscape from '@app/hooks/useIsLandscape';
import { StreamStackParamList } from '@app/navigation/Stream/StreamStack';
import twitchQueries from '@app/queries/twitchQueries';
import truncate from '@app/utils/truncate';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQueries } from '@tanstack/react-query';
import { Dimensions, SafeAreaView, Text, View } from 'react-native';
import WebView from 'react-native-webview';

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
    <SafeAreaContainer>
      <View
        style={{
          display: 'flex',
          flexDirection: landscape ? 'row' : 'column',
          margin: 0,
          padding: 0,
        }}
      >
        {/* video and video details */}
        <View
          style={{
            flex: landscape ? 2 : 3,
          }}
        >
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
          <View
            style={{
              flexDirection: landscape ? 'row' : 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              padding: 4,
            }}
          >
            <Image
              source={{ uri: userProfilePicture }}
              style={{ width: 35, height: 35, borderRadius: 14 }}
            />
            <Text>{stream?.user_name ?? user?.display_name}</Text>
            <View
              style={{
                marginLeft: 8,
                marginTop: 5,
                flexWrap: 'wrap',
              }}
            >
              {stream?.title && <Text>{truncate(stream?.title, 40)}</Text>}
              {stream?.game_name && (
                <Text
                  style={{
                    marginTop: 4,
                  }}
                >
                  {stream?.game_name}
                </Text>
              )}
              {stream?.tags && <Tags tags={stream?.tags} />}
            </View>
          </View>
          <Seperator />
        </View>
        <View
          style={{
            height: 400,
            flex: landscape ? 1 : 2,
            maxHeight: Dimensions.get('window').height - 10,
            width: landscape ? 200 : Dimensions.get('window').width,
          }}
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
        </View>
      </View>
    </SafeAreaContainer>
  );
};
export default LiveStreamScreen;
