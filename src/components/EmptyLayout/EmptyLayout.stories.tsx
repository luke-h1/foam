import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { SymbolView } from '@app/components/ui/Icon/Icon';

import {
  EmptyLayout,
  EmptyLayoutButton,
  EmptyLayoutContent,
  EmptyLayoutDescription,
  EmptyLayoutHeader,
  EmptyLayoutMedia,
  EmptyLayoutTitle,
} from './EmptyLayout';

const meta = {
  title: 'components/EmptyLayout',
  component: EmptyLayout,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof EmptyLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <EmptyLayoutHeader>
          <EmptyLayoutMedia>
            <SymbolView name='tv' size={40} />
          </EmptyLayoutMedia>
          <EmptyLayoutTitle>No live channels</EmptyLayoutTitle>
          <EmptyLayoutDescription>
            Channels you follow will show up here when they go live.
          </EmptyLayoutDescription>
        </EmptyLayoutHeader>
        <EmptyLayoutContent>
          <EmptyLayoutButton title='Browse streams' onPress={() => {}} />
        </EmptyLayoutContent>
      </>
    ),
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: (
      <>
        <EmptyLayoutHeader>
          <EmptyLayoutMedia>
            <SymbolView name='magnifyingglass' size={40} />
          </EmptyLayoutMedia>
          <EmptyLayoutTitle>No results</EmptyLayoutTitle>
          <EmptyLayoutDescription>
            Try a different search term.
          </EmptyLayoutDescription>
        </EmptyLayoutHeader>
        <EmptyLayoutContent>
          <EmptyLayoutButton
            title='Clear search'
            variant='outline'
            onPress={() => {}}
          />
        </EmptyLayoutContent>
      </>
    ),
  },
};
