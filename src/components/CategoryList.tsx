import { FlatList, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { Category } from '../services/twitchService';
import CategoryItem from './CategoryItem';

interface Props {
  categories: Category[];
}

const CategoryList = ({ categories }: Props) => {
  return (
    <KeyboardAvoidingView>
      <View>
        <FlatList<Category>
          style={styles.list}
          numColumns={3}
          data={categories}
          // eslint-disable-next-line no-shadow
          renderItem={data => <CategoryItem category={data.item} />}
          keyExtractor={item => item.id}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  list: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    padding: 8,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 24,
    paddingBottom: 32,
  },
});

export default CategoryList;
