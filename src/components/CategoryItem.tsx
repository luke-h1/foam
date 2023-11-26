/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Category } from '../services/twitchService';
import colors from '../styles/colors';
import { blurhash } from '../utils/blurhash';

interface Props {
  category: Category;
}

const CategoryItem = ({ category }: Props) => {
  return (
    <TouchableOpacity style={styles.category}>
      <Image
        style={styles.image}
        source={{
          // eslint-disable-next-line camelcase
          uri: category.box_art_url
            .replace('{width}', '98')
            .replace('{height}', '130'),
          width: 98,
          height: 130,
        }}
        placeholder={blurhash}
        contentFit="cover"
        transition={0}
      />
      <Text style={styles.categoryName} numberOfLines={1}>
        {category.name}
      </Text>
      <View style={styles.categoryStatus} />
    </TouchableOpacity>
  );
};
export default CategoryItem;

const styles = StyleSheet.create({
  category: {
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: 98,
    height: 130,
  },
  categoryName: {
    marginTop: 5,
    maxWidth: 98,
    color: colors.black,
    fontSize: 14,
  },
  categoryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redCircle: {
    backgroundColor: colors.red,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  info: {
    marginLeft: 4,
    paddingBottom: 1,
    color: colors.gray,
  },
});
