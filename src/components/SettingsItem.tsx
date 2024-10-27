import theme from '@app/styles/theme';
import {
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Seperator from './Seperator';
import Text from './Text';

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

export default function SettingsItem({ contents }: Props) {
  return (
    <View style={styles.settingsContainer}>
      <FlatList
        data={contents}
        renderItem={({ item }) => (
          <View>
            <Text weight="bold" style={{ marginBottom: 15 }}>
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
                      <Text>{item.title}</Text>
                      <Text size="sm">{item.content}</Text>
                    </View>
                    {item.showRightArrow && item.iconRight}
                  </TouchableOpacity>
                  {item.showSeperator && (
                    <Seperator color={theme.color.black} />
                  )}
                </View>
              )}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create<{
  settingsContainer: ViewStyle;
  item: ViewStyle;
  copy: TextStyle;
  settingsItem: ViewStyle;
}>({
  settingsContainer: {
    padding: theme.spacing.md,
    display: 'flex',
    flex: 1,
    alignItems: 'flex-start',
  },
  item: {
    marginBottom: 30,
    display: 'flex',
    alignContent: 'flex-start',
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
