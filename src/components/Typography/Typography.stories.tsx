import { FontWeight, ThemeColor, getAppTheme } from '@app/styles';
import { typedObjectEntries, typedObjectKeys } from '@app/utils';
import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography as TypographyComponent } from './Typography';

interface Props {
  fontWeight?: FontWeight;
  fontColor?: ThemeColor;
}

function Texts({ fontColor, fontWeight }: Props) {
  const { theme } = useUnistyles();

  const sizes = useMemo(
    () =>
      typedObjectEntries(theme.font.fontSize).map(([name, value]) => ({
        name,
        value,
      })),
    [theme.font.fontSize],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {sizes.map(size => (
        <View key={size.name} style={styles.row}>
          <TypographyComponent size="sm" style={{ flex: 1 }}>
            ${size.name} (${size.value})
          </TypographyComponent>
          <TypographyComponent
            numberOfLines={1}
            size={size.name}
            weight={fontWeight}
            color={fontColor}
            style={{
              flex: 6,
            }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </TypographyComponent>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    rowGap: 10,
    padding: theme.spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
}));

const meta = {
  title: 'components/Typography',
  tags: ['components'],
  component: Texts,
} satisfies Meta<typeof Texts>;

export default meta;

type Story = StoryObj<typeof meta>;

const fontWeight = typedObjectKeys(getAppTheme().font.fontWeight);
const colors = typedObjectKeys(getAppTheme().colors);

export const Text: Story = {
  argTypes: {
    fontWeight: {
      control: {
        type: 'radio',
      },
      options: fontWeight,
    },
    fontColor: {
      control: {
        type: 'select',
      },
      options: colors,
    },
  },
};
