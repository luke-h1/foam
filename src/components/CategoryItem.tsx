/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Image, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Category } from '../services/twitchService';
import colors from '../styles/colors';

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
