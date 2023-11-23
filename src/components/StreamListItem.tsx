/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import twitchService, { Stream, UserResponse } from '../services/twitchService';
import colors from '../styles/colors';
import elapsedStreamTime from '../utils/elapsedStreamTime';
import viewFormatter from '../utils/viewFormatter';

interface Props {
  stream: Stream;
}

const StreamListItem = ({ stream }: Props) => {
  const { auth } = useAuthContext();
  const [userImage, setUserImage] = useState<UserResponse>();

  // const getUserProfilePictures = async () => {
  //   const res = await twitchService.getUser(
  //     stream.user_login,
  //     (auth?.anonToken as string) ?? (auth?.token?.accessToken as string),
  //   );

  //   setUsers(res);
  // };

  // useEffect(() => {
  //   getUserProfilePictures();
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [stream]);

  return (
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
                uri: userImage?.profile_image_url,
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
        <View style={styles.tagRow}>
          <FlatList
            data={stream.tags}
            renderItem={({ item }) => (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
              </View>
            )}
            keyExtractor={item => item}
            horizontal
          />
        </View>
      </View>
    </View>
  );
};

export default StreamListItem;

const styles = StyleSheet.create({
  viewCount: {
    color: colors.gray,
    marginTop: 4,
    fontSize: 12,
    marginBottom: 8,
  },
  streamContainer: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 24,
    marginRight: 24,
  },
  streamColumn: {
    marginLeft: 11,
    flex: 1,
  },
  streamRow: {
    // height: 66,
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
    marginLeft: 5,
  },
  streamDescription: {
    color: colors.black,
  },
  streamCategory: {
    color: colors.gray,
  },
  tagRow: {
    marginTop: 17,
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: colors.tag,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  tagText: {
    color: colors.black,
    fontSize: 13,
  },
  streamImage: {
    width: 360,
    height: 200,
    borderRadius: 10,
  },
});
