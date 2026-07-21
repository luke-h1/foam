import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { BadgePreviewSheet } from './BadgePreviewSheet';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const badgeFixture: SanitisedBadgeSet | undefined =
  twitchSanitisedGlobalBadges.find(badge => badge.id === 'premium_1') ??
  twitchSanitisedGlobalBadges[0];

if (!badgeFixture) {
  throw new Error('badge fixture is missing');
}

const selectedBadge = badgeFixture;

const meta = {
  title: 'components/Chat/BadgePreviewSheet',
  component: BadgePreviewSheet,
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
  args: {
    visible: false,
    onClose: () => {},
    selectedBadge,
  },
} satisfies Meta<typeof BadgePreviewSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetProps = React.ComponentProps<typeof BadgePreviewSheet>;

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
      <BadgePreviewSheet
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
