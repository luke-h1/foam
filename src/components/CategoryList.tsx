import { FlatList, StyleSheet } from 'react-native';
import apex from '../../assets/data/category_apex.jpg';
import csgo from '../../assets/data/category_csgo.jpg';
import fallguys from '../../assets/data/category_fallguys.jpg';
import fortnite from '../../assets/data/category_fortnite.jpg';
import lol from '../../assets/data/category_lol.jpg';
import valorant from '../../assets/data/category_valorant.jpg';
import CategoryItem, { Category } from './CategoryItem';

const data: Category[] = [
  { name: 'League of Legends', source: lol },
  { name: 'VALORANT', source: valorant },
  { name: 'Counter-Strike: Global Offensive', source: csgo },
  { name: 'Fortnite', source: fortnite },
  { name: 'Fall Guys', source: fallguys },
  { name: 'Apex Legends', source: apex },
];

const CategoryList = () => {
  return (
    <FlatList<Category>
      style={styles.list}
      numColumns={3}
      data={data}
      // eslint-disable-next-line no-shadow
      renderItem={data => (
        <CategoryItem name={data.item.name} source={data.item.source} />
      )}
    />
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
    paddingBottom: 24,
  },
});

export default CategoryList;
