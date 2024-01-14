import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack } from 'tamagui';
import Seperator from './Seperator';
import { Text } from './Text';

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
      <Text variant="heading3">Settings</Text>
      <FlatList
        data={contents}
        renderItem={({ item }) => (
          <Stack style={{ marginBottom: 24 }}>
            <Text variant="body2" marginBottom={4}>
              {item.ctaTitle}
            </Text>
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
                      <Text variant="body3" marginBottom={5} marginTop={4}>
                        {item.title}
                      </Text>
                      <Text variant="body3">{item.content}</Text>
                    </View>
                    {item.showRightArrow && item.iconRight}
                  </TouchableOpacity>
                  {item.showSeperator && <Seperator color="$neutral1" />}
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
