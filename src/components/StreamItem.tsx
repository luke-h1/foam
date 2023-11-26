import { Image } from 'expo-image';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Stream } from '../services/twitchService';
import colors from '../styles/colors';
import { blurhash } from '../utils/blurhash';

interface Props {
  stream: Stream;
}

const StreamItem = ({ stream }: Props) => {
  return (
    <View style={styles.channelBox}>
      <View style={styles.liveScreen}>
        <Image
          source={{
            uri: stream.thumbnail_url
              .replace('{width}', '1920')
              .replace('{height}', '1080'),
            width: 300,
            height: 100,
          }}
          placeholder={blurhash}
          contentFit="cover"
          transition={0}
        />
      </View>
      <View style={styles.liveInfo}>
        <View style={styles.user}>
          <View style={styles.userPp}>
            <Image
              source={{ uri: stream.thumbnail_url }}
              style={styles.userPp}
            />
          </View>
          <Text style={styles.userName}>{stream.user_name}</Text>
        </View>
        <Text style={styles.titleGame}>{stream.title}</Text>
        <Text style={styles.titleGame}>{stream.game_name}</Text>

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
export default StreamItem;

export const styles = StyleSheet.create({
  channelBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    cursor: 'pointer',
    zIndex: 2,
    color: colors.gray,
  },
  liveScreen: {
    position: 'relative',
    width: '35%',
    minWidth: 150,
    minHeight: 50,
    backgroundColor: 'black',
    borderRadius: 3,
    overflow: 'hidden',
    zIndex: -1,
    color: colors.gray,
  },

  liveIcon: {
    color: colors.red,
    fontSize: 9,
  },
  liveInfo: {
    flex: 1,
    paddingHorizontal: 10,
    color: colors.gray,
  },
  user: {
    flexDirection: 'row',
    color: colors.gray,
  },
  userPp: {
    width: 15,
    height: 15,
    borderRadius: 999,
    overflow: 'hidden',
  },
  userName: {
    // paddingLeft: 5,
    fontWeight: '600',
    color: colors.gray,
  },
  titleGame: {
    fontSize: 14,
    color: colors.gray,
  },
  tagRow: {
    marginTop: 17,
    flexDirection: 'row',
    height: 20,
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
});
