import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { H4, H6, Stack, Text } from 'tamagui';
import Seperator from './Seperator';

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
    <Stack padding={12}>
      <H4>Settings</H4>
      <FlatList
        data={contents}
        renderItem={({ item }) => (
          <Stack style={{ marginBottom: 24 }}>
            <H6>{item.ctaTitle}</H6>
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
                      <Text>{item.title}</Text>
                      <Text>{item.content}</Text>
                    </View>
                    {item.showRightArrow && item.iconRight}
                  </TouchableOpacity>
                  {item.showSeperator && <Seperator />}
                </View>
              )}
            />
          </Stack>
        )}
      />
    </Stack>
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
