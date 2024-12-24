import { colors, spacing } from '@app/styles';
import { FlatList, TouchableOpacity, View, ViewStyle } from 'react-native';
import Seperator from './Seperator';
import { Text } from './ui/Text';

interface ContentItem {
  onPress?: () => void;
  iconLeft?: JSX.Element;
  title: string;
  content: string;
  iconRight?: JSX.Element;
  showRightArrow?: boolean;
  showSeperator?: boolean;
}

export interface Content {
  id: string;
  ctaTitle: string;
  items: ContentItem[];
}

interface Props {
  contents: Content[];
}

export default function SettingsItem({ contents }: Props) {
  return (
    <View style={$settingsContainer}>
      <FlatList
        data={contents}
        renderItem={({ item }) => (
          <View>
            <Text style={{ marginBottom: 15 }}>{item.ctaTitle}</Text>
            <FlatList<ContentItem>
              data={item.items}
              // eslint-disable-next-line no-shadow
              renderItem={({ item }) => (
                <View style={$item}>
                  <TouchableOpacity
                    style={$settingsItem}
                    onPress={item.onPress}
                  >
                    {item.iconLeft}
                    <View style={$copy}>
                      <Text>{item.title}</Text>
                      <Text>{item.content}</Text>
                    </View>
                    {item.showRightArrow && item.iconRight}
                  </TouchableOpacity>
                  {item.showSeperator && <Seperator color={colors.tint} />}
                </View>
              )}
            />
          </View>
        )}
      />
    </View>
  );
}

const $settingsContainer: ViewStyle = {
  padding: spacing.medium,
  display: 'flex',
  flex: 1,
  alignItems: 'flex-start',
};

const $item: ViewStyle = {
  marginBottom: 30,
  display: 'flex',
  alignContent: 'flex-start',
};

const $copy: ViewStyle = {
  marginLeft: 12,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
  width: '85%',
  flexWrap: 'wrap',
};

const $settingsItem: ViewStyle = {
  display: 'flex',
  alignContent: 'center',
  flexDirection: 'row',
  alignItems: 'center',
};
