import { FlatList } from 'react-native';
import { Text, View, XStack } from 'tamagui';
import colors from '../styles/colors';

interface Props {
  tags: string[];
}

const Tags = ({ tags }: Props) => {
  return (
    <XStack marginTop={4} marginBottom={2}>
      <FlatList
        data={tags}
        showsHorizontalScrollIndicator
        renderItem={({ item }) => (
          <View
            backgroundColor={colors.tag}
            paddingHorizontal={8}
            borderRadius={10}
            marginRight={5}
          >
            <Text color="#fff" numberOfLines={1}>
              {item}
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        horizontal
      />
    </XStack>
  );
};
export default Tags;
