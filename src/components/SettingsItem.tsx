import {
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
} from 'react-native';
import Seperator from './Seperator';

export interface ContentItem {
  id: string;
  ctaTitle: string;
  items: {
    onPress?: () => void;
    iconLeft?: JSX.Element;
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
      <Text>Settings</Text>
      <FlatList
        data={contents}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 24 }}>
            <Text>{item.ctaTitle}</Text>
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
                      <Text
                        style={{
                          marginBottom: 5,
                          marginTop: 4,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text>{item.content}</Text>
                    </View>
                    {item.showRightArrow && item.iconRight}
                  </TouchableOpacity>
                  {item.showSeperator && <Seperator color="$neutral1" />}
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
