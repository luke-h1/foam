import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootRoutes } from '../navigation/RootStack';
import {
  StreamRoutes,
  StreamStackParamList,
} from '../navigation/Stream/StreamStack';
import twitchService, { Stream } from '../services/twitchService';
import colors from '../styles/colors';
import elapsedStreamTime from '../utils/elapsedStreamTime';
import viewFormatter from '../utils/viewFormatter';
import Image from './Image';

interface Props {
  stream: Stream;
}

const StreamListItem = ({ stream }: Props) => {
  const [broadcasterImage, setBroadcasterImage] = useState<string>();
  const { navigate } = useNavigation<NavigationProp<StreamStackParamList>>();

  const getUserProfilePictures = async () => {
    const res = await twitchService.getUserImage(stream.user_login);
    setBroadcasterImage(res);
  };

  useEffect(() => {
    getUserProfilePictures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <TouchableOpacity
      onPress={() =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        navigate(RootRoutes.LiveStream, {
          screen: StreamRoutes.LiveStream,
          params: {
            id: stream.user_login,
          },
        })
      }
    >
      <View style={styles.streamContainer}>
        <View style={styles.streamColumn}>
          <Image
            style={styles.streamImage}
            source={{
              height: 300,
              width: 300,
              uri: stream.thumbnail_url
                .replace('{width}', '1920')
                .replace('{height}', '1080'),
            }}
          />

          <View style={styles.streamRow}>
            <View style={styles.streamHeader}>
              <Image
                style={styles.streamAvatar}
                source={{
                  uri: broadcasterImage ?? stream.thumbnail_url,
                  width: 20,
                  height: 20,
                }}
              />
              <Text style={styles.streamUsername} numberOfLines={1}>
                {stream.user_name}
              </Text>
            </View>
            <Text style={styles.streamDescription} numberOfLines={1}>
              {stream.title}
            </Text>
            <Text style={styles.streamCategory} numberOfLines={1}>
              {stream.game_name}
            </Text>
            <View
              style={{
                // drop any children onto next line
                marginTop: 1,
                // flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: colors.red,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginRight: 5,
                }}
              />
              <Text style={{ color: colors.gray }}>
                {elapsedStreamTime(stream.started_at)}
              </Text>
            </View>
            <Text style={styles.viewCount}>
              {viewFormatter(stream.viewer_count, 1)} viewers
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default StreamListItem;

const styles = StyleSheet.create({
  viewCount: {
    color: colors.gray,
    marginTop: 4,
  },
  streamContainer: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 20,
    marginTop: 20,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 14,
  },
  streamColumn: {
    flex: 1,
  },
  streamRow: {
    justifyContent: 'space-between',
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  streamAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.tag,
  },
  streamUsername: {
    color: colors.black,
    marginLeft: 3,
  },
  streamDescription: {
    color: colors.black,
  },
  streamCategory: {
    color: colors.gray,
  },
  streamImage: {
    width: 420,
    height: 200,
  },
});
