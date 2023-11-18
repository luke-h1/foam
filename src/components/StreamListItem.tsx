import { Image, StyleSheet, Text, View } from 'react-native';
import colors from '../styles/colors';

const StreamListItem = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tags = [
    'gaming',
    'chatting',
    'english',
    'dutch',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'Evil',
    'Evil',
    'Unhygienic',
    'Unholy',
    'English',
    'Geriatric',
  ];

  return (
    <View style={styles.streamContainer}>
      <View style={styles.streamColumn}>
        <Image
          source={{
            uri: 'https://fastly.picsum.photos/id/840/200/300.jpg?hmac=Z8Mc1xk7GaQHQ1hkPTK4cY0dYIxDKGBCHrgyaDqE0u0',
            width: 320,
            height: 220,
          }}
        />

        <View style={styles.streamRow}>
          <View style={styles.streamHeader}>
            <Image
              style={styles.streamAvatar}
              source={{ uri: 'https://picsum.photos/200/300' }}
            />
            <Text style={styles.streamUsername} numberOfLines={1}>
              username
            </Text>
          </View>
          <Text style={styles.streamDescription} numberOfLines={1}>
            🔥CLICK🔥LIVE🔥ASAP🔥DRAMA🔥JUICE🔥VIDEOS🔥REACT🔥GAMES🔥HIGH
            IQ🔥WISDOM🔥GIVEN🔥FOR🔥FREE🔥FROM🔥JUICE WARLORD🔥POG
          </Text>
          <Text style={styles.streamCategory} numberOfLines={1}>
            Just Chatting
          </Text>
        </View>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>yo yo yo</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>hi</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default StreamListItem;

const styles = StyleSheet.create({
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
    height: 66,
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
    marginTop: 8,
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
});
