import { FlatList, StyleSheet, Text, View } from 'react-native';
import colors from '../styles/colors';

interface Props {
  tags: string[];
  marginTop?: number;
  marginBottom?: number;
}

const Tags = ({ tags, marginTop = 13, marginBottom }: Props) => {
  return (
    <View
      style={[
        styles.tagRow,
        {
          marginTop,
          marginBottom,
        },
      ]}
    >
      <FlatList
        data={tags}
        renderItem={({ item }) => (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        )}
        keyExtractor={item => item}
        horizontal
      />
    </View>
  );
};
export default Tags;

const styles = StyleSheet.create({
  tagRow: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: colors.tag,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 5,
  },
  tagText: {
    color: colors.black,
    fontSize: 13,
  },
});
