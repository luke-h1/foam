import { FlatList } from 'react-native';
import { View, XStack } from 'tamagui';
import { Text } from './Text';

interface Props {
  tags: string[];
}

const Tags = ({ tags }: Props) => {
  return (
    <XStack marginTop={4} marginBottom={2} maxWidth={400}>
      <FlatList
        data={tags}
        showsHorizontalScrollIndicator
        renderItem={({ item }) => (
          <View
            borderRadius={5}
            backgroundColor="$surface4"
            marginRight={5}
            paddingHorizontal={5}
          >
            <Text color="$color" loading={!tags} fontSize={14}>
              {item}
            </Text>
          </View>
        )}
        keyExtractor={index => index.toString()}
        horizontal
      />
    </XStack>
  );
};
export default Tags;
