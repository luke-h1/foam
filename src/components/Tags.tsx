import { FlatList, Text, View } from 'react-native';

interface Props {
  tags: string[];
}

const Tags = ({ tags }: Props) => {
  return (
    <View
      style={{
        marginTop: 4,
        marginBottom: 2,
        maxWidth: 400,
      }}
    >
      <FlatList
        data={tags}
        showsHorizontalScrollIndicator
        renderItem={({ item }) => (
          <View
            style={{
              borderRadius: 5,
              backgroundColor: '$surface4',
              marginRight: 5,
              paddingHorizontal: 5,
            }}
          >
            <Text>{item}</Text>
          </View>
        )}
        keyExtractor={index => index.toString()}
        horizontal
      />
    </View>
  );
};
export default Tags;
