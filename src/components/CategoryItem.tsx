/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Image, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import colors from '../styles/colors';

export interface Category {
  name: string;
  source: string;
}

interface Props extends Category {}

const CategoryItem = ({ name, source }: Props) => {
  return (
    <TouchableOpacity style={styles.category}>
      {/* @ts-expect-error */}
      <Image style={styles.image} source={source} />
      <Text style={styles.categoryName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.categoryStatus}>
        <View style={styles.redCircle} />
        <Text style={styles.info}>51.9k</Text>
      </View>
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
