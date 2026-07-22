import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { twitchKeys } from '@app/lib/react-query/query-keys';
import { userInfoFixture } from '@app/services/__fixtures__/twitch/userInfo.fixture';

import { UserActionSheet } from './UserActionSheet';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

queryClient.setQueryData(twitchKeys.user('testuser'), userInfoFixture);

const meta = {
  title: 'components/Chat/UserActionSheet',
  component: UserActionSheet,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    onCopyUsername: { action: 'onCopyUsername' },
    onHideUser: { action: 'onHideUser' },
    onHighlightUser: { action: 'onHighlightUser' },
    onMentionUser: { action: 'onMentionUser' },
    onBlockUser: { action: 'onBlockUser' },
    onReportUser: { action: 'onReportUser' },
    onTimeoutUser: { action: 'onTimeoutUser' },
    onWarnUser: { action: 'onWarnUser' },
    onBanUser: { action: 'onBanUser' },
  },
  args: {
    username: 'TestUser',
    login: 'testuser',
    color: '#FF4500',
    moderation: { canModerateChat: false },
    visibility: { isHidden: false, isHighlighted: false, visible: false },
    onClose: () => {},
    onCopyUsername: () => {},
    onHideUser: () => {},
    onHighlightUser: () => {},
    onMentionUser: () => {},
  },
} satisfies Meta<typeof UserActionSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetProps = React.ComponentProps<typeof UserActionSheet>;

function SheetWrapper(props: Omit<SheetProps, 'onClose'>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <UserActionSheet
        {...props}
        visibility={{ ...props.visibility, visible }}
        onClose={() => setVisible(false)}
      />
    </View>
  );
}

function renderSheetStory(args: SheetProps) {
  const { onClose: _onClose, ...sheetArgs } = args;

  return <SheetWrapper {...sheetArgs} />;
}

export const Default: Story = {
  render: renderSheetStory,
};

export const WithBlockAndReport: Story = {
  args: {
    onBlockUser: () => {},
    onReportUser: () => {},
  },
  render: renderSheetStory,
};

export const Moderator: Story = {
  args: {
    moderation: { canModerateChat: true, canModerateUser: true },
    onTimeoutUser: () => {},
    onWarnUser: () => {},
    onBanUser: () => {},
  },
  render: renderSheetStory,
};

export const HighlightedUser: Story = {
  args: {
    visibility: { isHidden: false, isHighlighted: true, visible: false },
  },
  render: renderSheetStory,
};
