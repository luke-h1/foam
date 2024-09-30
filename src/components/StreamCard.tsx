import { HomeTabsParamList } from '@app/navigation/Home/HomeTabs';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import twitchService, { Stream } from '@app/services/twitchService';
import elapsedStreamTime from '@app/utils/elapsedStreamTime';
import viewFormatter from '@app/utils/viewFormatter';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Tags from './Tags';

const IMAGE_ASPECT_RATIO = 240 / 165;
const IMAGE_HEIGHT = 85;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

interface Props {
  stream: Stream;
}

const StreamCard = ({ stream }: Props) => {
  const { navigate } = useNavigation<NavigationProp<HomeTabsParamList>>();
  const [broadcasterImage, setBroadcasterImage] = useState<string>();

  const getUserProfilePictures = async () => {
    const res = await twitchService.getUserImage(stream.user_login);
    setBroadcasterImage(res);
  };

  useEffect(() => {
    getUserProfilePictures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <View
      style={{
        marginBottom: 17,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}
    >
      <Pressable
        onPress={() =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          navigate(StreamRoutes.LiveStream, {
            screen: StreamRoutes.LiveStream,
            params: {
              id: stream.user_login,
            },
          })
        }
      >
        <View
          style={{
            width: IMAGE_WIDTH,
            height: IMAGE_WIDTH,
            marginRight: 16,
          }}
        >
          <Image
            source={{
              uri: stream.thumbnail_url
                .replace('{width}', '320')
                .replace('{height}', '180'),
            }}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
          />
          <View
            style={{
              position: 'absolute',
              left: 2,
              bottom: 4,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 4,
              paddingHorizontal: 4,
              paddingVertical: 2,
            }}
          >
            <Text numberOfLines={1}>
              <Text>●</Text> {viewFormatter(stream.viewer_count, 1)}
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 4,
              paddingHorizontal: 4,
              paddingVertical: 2,
            }}
          >
            <Text numberOfLines={1}>
              {elapsedStreamTime(stream.started_at)}
            </Text>
          </View>
        </View>
      </Pressable>
      <View
        style={{
          justifyContent: 'space-between',
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() =>
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              navigate(StreamRoutes.LiveStream, {
                screen: StreamRoutes.LiveStream,
                params: {
                  id: stream.user_login,
                },
              })
            }
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
                marginTop: 4,
              }}
            >
              <Image
                style={{
                  width: 22,
                  aspectRatio: 1,
                  borderRadius: 12,
                  marginRight: 4,
                }}
                source={{ uri: broadcasterImage }}
              />
              <View
                style={{
                  alignItems: 'center',
                }}
              >
                <Text numberOfLines={1}>{stream.user_name}</Text>
              </View>
            </View>
          </Pressable>
          <Pressable
            onPress={() =>
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              navigate(StreamRoutes.LiveStream, {
                screen: StreamRoutes.LiveStream,
                params: {
                  id: stream.user_login,
                },
              })
            }
          >
            <View>
              <Text numberOfLines={1} lineBreakMode="clip">
                {stream.title}
              </Text>
              <Text numberOfLines={1} lineBreakMode="clip">
                {stream.game_name}
              </Text>
            </View>
          </Pressable>
          {stream.tags && stream.tags.length > 0 && <Tags tags={stream.tags} />}
        </View>
      </View>
    </View>
  );
};
export default StreamCard;
