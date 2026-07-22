import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { stvGlobalBaseEmote } from '../ChatMessage/richChatMessageStoryFixtures';
import { ActionSheet } from './ActionSheet';

const messagePreview: ParsedPart[] = [
  { type: 'text', content: 'have you seen this emote ' },
  {
    type: 'emote',
    content: stvGlobalBaseEmote.name,
    id: stvGlobalBaseEmote.id,
    name: stvGlobalBaseEmote.name,
    url: stvGlobalBaseEmote.url,
    static_url: stvGlobalBaseEmote.static_url,
    site: stvGlobalBaseEmote.site,
  },
  { type: 'text', content: ' it is great' },
];

const meta = {
  title: 'components/Chat/ActionSheet',
  component: ActionSheet,
  decorators: [
    Story => (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: '#0E0E10',
            justifyContent: 'flex-end',
          }}
        >
          <Story />
        </View>
      </SafeAreaProvider>
    ),
  ],
  argTypes: {
    onReply: { action: 'onReply' },
    onCopy: { action: 'onCopy' },
    onHidePhrase: { action: 'onHidePhrase' },
    onHideUser: { action: 'onHideUser' },
    onHighlightUser: { action: 'onHighlightUser' },
    onPinMessage: { action: 'onPinMessage' },
    onDeleteMessage: { action: 'onDeleteMessage' },
    onTimeoutUser: { action: 'onTimeoutUser' },
    onBanUser: { action: 'onBanUser' },
  },
  args: {
    visible: false,
    onClose: () => {},
    onReply: () => {},
    onCopy: () => {},
    username: 'TestUser',
    messagePreview,
  },
} satisfies Meta<typeof ActionSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetProps = React.ComponentProps<typeof ActionSheet>;

function SheetWrapper(props: Omit<SheetProps, 'visible' | 'onClose'>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ActionSheet
        {...props}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </View>
  );
}

function renderSheetStory(args: SheetProps) {
  const { visible: _visible, onClose: _onClose, ...sheetArgs } = args;

  return <SheetWrapper {...sheetArgs} />;
}

export const Default: Story = {
  render: renderSheetStory,
};

export const Moderator: Story = {
  args: {
    canModerateChat: true,
    canModerateUser: true,
    canDeleteMessage: true,
    canPinMessage: true,
  },
  render: renderSheetStory,
};

export const PinnedMessage: Story = {
  args: {
    canModerateChat: true,
    canPinMessage: true,
    isPinnedMessage: true,
  },
  render: renderSheetStory,
};
