import { FlatList } from 'react-native';
import { Text, View, XStack } from 'tamagui';
import { colors } from '../styles';

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
            backgroundColor={colors.gray750}
            paddingHorizontal={8}
            borderRadius={10}
            marginRight={5}
          >
            <Text color="$color" numberOfLines={1}>
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
