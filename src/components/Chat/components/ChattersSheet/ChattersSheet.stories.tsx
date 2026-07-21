import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin/registerMentionChatter';

import { ChattersSheet } from './ChattersSheet';

registerMentionChatter({
  login: 'streamer_main',
  userId: '100',
  color: '#FF4500',
  role: 'broadcaster',
});
registerMentionChatter({
  login: 'mod_alice',
  userId: '101',
  color: '#00FF7F',
  role: 'moderator',
});
registerMentionChatter({
  login: 'mod_bob',
  userId: '102',
  color: '#1E90FF',
  role: 'moderator',
});
registerMentionChatter({
  login: 'vip_carol',
  userId: '103',
  color: '#FF69B4',
  role: 'vip',
});
registerMentionChatter({
  login: 'viewer_dan',
  userId: '104',
  color: '#9ACD32',
});
registerMentionChatter({
  login: 'viewer_eve',
  userId: '105',
  color: '#DAA520',
});
registerMentionChatter({
  login: 'viewer_frank',
  userId: '106',
  color: '#5F9EA0',
});

const meta = {
  title: 'components/Chat/ChattersSheet',
  component: ChattersSheet,
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
    onSelectChatter: { action: 'onSelectChatter' },
  },
  args: {
    isPresented: false,
    onDismiss: () => {},
    onSelectChatter: () => {},
  },
} satisfies Meta<typeof ChattersSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetProps = React.ComponentProps<typeof ChattersSheet>;

function SheetWrapper(props: Omit<SheetProps, 'isPresented' | 'onDismiss'>) {
  const [isPresented, setIsPresented] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPresented(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ChattersSheet
        {...props}
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
      />
    </View>
  );
}

function renderSheetStory(args: SheetProps) {
  const {
    isPresented: _isPresented,
    onDismiss: _onDismiss,
    ...sheetArgs
  } = args;

  return <SheetWrapper {...sheetArgs} />;
}

export const Default: Story = {
  render: renderSheetStory,
};
