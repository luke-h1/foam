import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Text, TextType, TextWeight } from './Text';

const meta = {
  title: 'components/Text',
  component: Text,
  decorators: [
    Story => (
      <View style={{ padding: 16, gap: 8 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    type: {
      control: 'select',
      options: [
        'default',
        'base',
        'xxxs',
        'xxs',
        'xs',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl',
        '3xl',
        '4xl',
        '5xl',
        'title',
        'subtitle',
        'body',
        'caption',
        'link',
      ],
    },
    weight: {
      control: 'select',
      options: [
        'ultralight',
        'thin',
        'light',
        'normal',
        'medium',
        'semibold',
        'bold',
        'heavy',
        'black',
      ],
    },
    variant: {
      control: 'select',
      options: ['default', 'mono'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    color: {
      control: 'select',
      options: ['gray', 'accent', 'blue', 'red', 'green', 'violet', 'purple'],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Hello, World!',
  },
};

export const AllSizes: Story = {
  render: () => {
    const sizes: TextType[] = [
      'xxxs',
      'xxs',
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      '4xl',
      '5xl',
    ];
    return (
      <View style={{ gap: 8 }}>
        {sizes.map(size => (
          <Text key={size} type={size}>
            {size}: The quick brown fox
          </Text>
        ))}
      </View>
    );
  },
};

export const SemanticSizes: Story = {
  render: () => {
    const semanticSizes: TextType[] = [
      'title',
      'subtitle',
      'body',
      'caption',
      'link',
    ];
    return (
      <View style={{ gap: 12 }}>
        {semanticSizes.map(size => (
          <Text key={size} type={size}>
            {size}: The quick brown fox jumps over the lazy dog
          </Text>
        ))}
      </View>
    );
  },
};

export const AllWeights: Story = {
  render: () => {
    const weights: TextWeight[] = [
      'ultralight',
      'thin',
      'light',
      'normal',
      'medium',
      'semibold',
      'bold',
      'heavy',
      'black',
    ];
    return (
      <View style={{ gap: 8 }}>
        {weights.map(weight => (
          <Text key={weight} type="lg" weight={weight}>
            {weight}: The quick brown fox
          </Text>
        ))}
      </View>
    );
  },
};

export const Colors: Story = {
  render: () => {
    const colors = [
      'gray',
      'accent',
      'blue',
      'red',
      'green',
      'violet',
      'purple',
    ] as const;
    return (
      <View style={{ gap: 8 }}>
        {colors.map(color => (
          <Text key={color} type="lg" color={color}>
            {color}: The quick brown fox
          </Text>
        ))}
      </View>
    );
  },
};

export const Alignment: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Text type="lg" align="left">
        Left aligned text
      </Text>
      <Text type="lg" align="center">
        Center aligned text
      </Text>
      <Text type="lg" align="right">
        Right aligned text
      </Text>
    </View>
  ),
};

export const Variants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Text type="lg" variant="default">
        Default variant: The quick brown fox
      </Text>
      <Text type="lg" variant="mono">
        Mono variant: const foo = 'bar';
      </Text>
    </View>
  ),
};

export const Italic: Story = {
  args: {
    children: 'This text is italic',
    type: 'lg',
    italic: true,
  },
};

export const Tabular: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text type="lg">Without tabular: 1,234,567.89</Text>
      <Text type="lg" tabular>
        With tabular: 1,234,567.89
      </Text>
    </View>
  ),
};

export const WithMargins: Story = {
  render: () => (
    <View style={{ backgroundColor: 'rgba(100, 100, 255, 0.1)' }}>
      <Text type="lg" m="lg">
        Margin all around (lg)
      </Text>
      <Text type="lg" mt="xl" mb="sm">
        Margin top (xl) and bottom (sm)
      </Text>
      <Text type="lg" mx="2xl">
        Horizontal margin (2xl)
      </Text>
    </View>
  ),
};

export const Title: Story = {
  args: {
    children: 'Page Title',
    type: 'title',
    weight: 'bold',
  },
};

export const Subtitle: Story = {
  args: {
    children: 'Section Subtitle',
    type: 'subtitle',
    weight: 'medium',
    color: 'gray',
  },
};

export const Caption: Story = {
  args: {
    children: 'This is a caption or helper text',
    type: 'caption',
    color: 'gray',
  },
};

export const LargeDisplay: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text type="5xl" weight="black">
        5XL Black
      </Text>
      <Text type="4xl" weight="bold">
        4XL Bold
      </Text>
      <Text type="3xl" weight="semibold">
        3XL Semibold
      </Text>
    </View>
  ),
};

export const NestedColorPath: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text type="lg" color="violet.accent">
        Violet accent color
      </Text>
      <Text type="lg" color="blue.accent">
        Blue accent color
      </Text>
      <Text type="lg" color="red.accent">
        Red accent color
      </Text>
    </View>
  ),
};
