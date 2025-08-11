import { BrandIcon } from '@app/components/BrandIcon';
import { Button } from '@app/components/Button';
import { Typography } from '@app/components/Typography';
import { isBrandIcon } from '@app/utils/typescript/type-guards/isBrandIcon';
import { ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  CATEGORY_HEADER_HEIGHT,
  EMOJI_SIZE,
  EmojiSection,
  PICKER_PAD,
  PICKER_RADIUS,
  PICKER_WIDTH,
} from './config';

export function EmojiCategoryBar({
  data,
  onPress,
  activeSection,
}: {
  data: EmojiSection[];
  onPress: (index: number) => void;
  activeSection: number;
}) {
  const { theme } = useUnistyles();

  return (
    <ScrollView
      // style={[styles.topbar, { backgroundColor: theme.colors.underline }]}
      contentContainerStyle={{
        padding: PICKER_PAD,
        gap: 4,
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {data.map((section, index) => {
        return (
          <Button
            key={section.title}
            onPress={() => onPress(index)}
            style={[
              styles.categoryButton,
              activeSection === index && {
                // backgroundColor: theme.colors.borderNeutral,
                borderWidth: 1,
                // borderColor: theme.colors.foregroundNeutral,
              },
            ]}
          >
            {isBrandIcon(section.icon) ? (
              <BrandIcon
                name={section.icon}
                size="md"
                color={section.icon === 'stv' ? 'text' : undefined}
              />
            ) : (
              <Typography>{section.icon}</Typography>
            )}
          </Button>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create(() => ({
  topbar: {
    position: 'absolute',
    top: 0,
    left: -PICKER_PAD,
    width: PICKER_WIDTH + 2 * PICKER_PAD,
    zIndex: 1,
    height: CATEGORY_HEADER_HEIGHT,
    borderTopLeftRadius: PICKER_RADIUS,
    borderTopRightRadius: PICKER_RADIUS,
  },
  categoryButton: {
    height: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PICKER_RADIUS / 2,
  },
  icon: {
    fontSize: EMOJI_SIZE / (PICKER_PAD / 2.5),
  },
}));
