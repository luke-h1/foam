import { FlatList, StyleSheet, View } from 'react-native';
import { Stream } from '../services/twitchService';
import StreamListItem from './StreamListItem';

interface Props {
  streams: Stream[];
}

const StreamList = ({ streams }: Props) => {
  return (
    <View style={styles.list}>
      <FlatList
        data={streams}
        renderItem={({ item }) => <StreamListItem stream={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

export default StreamList;

const styles = StyleSheet.create({
  list: {
    paddingTop: 8,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 24,
  },
});
