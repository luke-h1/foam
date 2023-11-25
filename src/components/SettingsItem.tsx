import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../styles/colors';
import Seperator from './Seperator';
import Title from './Title';

export interface ContentItem {
  id: string;
  ctaTitle: string;
  items: {
    onPress?: () => void;
    iconLeft: JSX.Element;
    title: string;
    content: string;
    iconRight?: JSX.Element;
    showRightArrow?: boolean;
    showSeperator?: boolean;
  }[];
}

interface Props {
  contents: ContentItem[];
}

const SettingsItem = ({ contents }: Props) => {
  return (
    <View>
      <Title>Settings</Title>
      <FlatList
        data={contents}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 24 }}>
            <Title>{item.ctaTitle}</Title>
            <View style={{ marginBottom: 8 }} />
            <FlatList
              data={item.items}
              // eslint-disable-next-line no-shadow
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={item.onPress}
                  >
                    {item.iconLeft}
                    <View style={styles.copy}>
                      <Text style={{ color: colors.gray }}>{item.title}</Text>
                      <Text style={{ color: colors.gray }}>{item.content}</Text>
                    </View>
                    {item.showRightArrow && item.iconRight}
                  </TouchableOpacity>
                  {item.showSeperator && <Seperator />}
                </View>
              )}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    marginBottom: 24,
  },
  copy: {
    marginLeft: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    textAlign: 'left',
    width: '85%',
    textAlignVertical: 'center',
    flexWrap: 'wrap',
  },
  settingsItem: {
    display: 'flex',
    alignContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SettingsItem;
