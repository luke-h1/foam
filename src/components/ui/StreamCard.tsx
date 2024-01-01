import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Image, Stack, Text, XStack } from 'tamagui';
import { HomeTabsParamList } from '../../navigation/Home/HomeTabs';
import { StreamRoutes } from '../../navigation/Stream/StreamStack';
import twitchService, { Stream } from '../../services/twitchService';
import elapsedStreamTime from '../../utils/elapsedStreamTime';
import viewFormatter from '../../utils/viewFormatter';
import Tags from '../Tags';

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
    <XStack
      marginBottom={17}
      display="flex"
      flexDirection="row"
      alignItems="flex-start"
      justifyContent="space-between"
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
        <Stack width={IMAGE_WIDTH} height={IMAGE_HEIGHT} marginRight={16}>
          <Image
            source={{
              uri: stream.thumbnail_url
                .replace('{width}', '320')
                .replace('{height}', '180'),
            }}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
          />
          <Stack
            position="absolute"
            left={2}
            bottom={4}
            backgroundColor="rgba(0,0,0,0.5)"
            borderRadius={4}
            paddingHorizontal={4}
            paddingVertical={2}
          >
            <Text color="white" numberOfLines={1}>
              {viewFormatter(stream.viewer_count, 1)}
            </Text>
          </Stack>
          <Stack
            position="absolute"
            backgroundColor="rgba(0,0,0,0.5)"
            borderRadius={4}
            paddingHorizontal={4}
            paddingVertical={2}
          >
            <Text color="white" numberOfLines={1}>
              {elapsedStreamTime(stream.started_at)}
            </Text>
          </Stack>
        </Stack>
      </Pressable>
      <Stack justifyContent="space-between" flexDirection="row">
        <Stack flex={1} flexDirection="column" justifyContent="space-between">
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
            <Stack
              flexDirection="row"
              alignItems="center"
              marginBottom={4}
              marginTop={4}
            >
              <Image
                source={{ uri: broadcasterImage }}
                width={22}
                aspectRatio={1}
                borderRadius={12}
                marginRight={4}
              />
              <Stack>
                <Text color="black" fontWeight="bold" numberOfLines={1}>
                  {stream.user_name}
                </Text>
              </Stack>
            </Stack>
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
            <Stack>
              <Text lineHeight={22} numberOfLines={1} lineBreakMode="clip">
                {stream.title}
              </Text>
              <Text lineHeight={19}>{stream.game_name}</Text>
            </Stack>
          </Pressable>
          {stream.tags && stream.tags.length > 0 && <Tags tags={stream.tags} />}
        </Stack>
      </Stack>
    </XStack>
  );
};
export default StreamCard;
