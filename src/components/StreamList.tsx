import { StyleSheet, View } from 'react-native';
import StreamListItem from './StreamListItem';

const StreamList = () => {
  return (
    <View style={styles.list}>
      <StreamListItem />
      <StreamListItem />
      <StreamListItem />
      <StreamListItem />
      <StreamListItem />
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
