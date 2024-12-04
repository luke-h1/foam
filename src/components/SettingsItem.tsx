import theme from '@app/styles/theme';
import {
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Seperator from './Seperator';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';

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
    <ThemedView style={styles.settingsContainer}>
      <FlatList
        data={contents}
        renderItem={({ item }) => (
          <View>
            <ThemedText fontWeight="bold" style={{ marginBottom: 15 }}>
              {item.ctaTitle}
            </ThemedText>
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
                      <ThemedText>{item.title}</ThemedText>
                      <ThemedText fontSize={13}>{item.content}</ThemedText>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create<{
  settingsContainer: ViewStyle;
  item: ViewStyle;
  copy: ViewStyle;
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
    width: '85%',
    flexWrap: 'wrap',
  },
  settingsItem: {
    display: 'flex',
    alignContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
