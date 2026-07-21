import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { stvGlobalBaseEmote } from '../ChatMessage/richChatMessageStoryFixtures';
import { EmotePreviewSheet } from './EmotePreviewSheet';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const selectedEmote: ParsedPart<'emote'> = {
  type: 'emote',
  content: stvGlobalBaseEmote.name,
  id: stvGlobalBaseEmote.id,
  name: stvGlobalBaseEmote.name,
  url: stvGlobalBaseEmote.url,
  static_url: stvGlobalBaseEmote.static_url,
  image_variants: stvGlobalBaseEmote.image_variants,
  emote_link: stvGlobalBaseEmote.emote_link,
  creator: stvGlobalBaseEmote.creator,
  original_name: stvGlobalBaseEmote.original_name,
  site: stvGlobalBaseEmote.site,
  width: stvGlobalBaseEmote.width,
  height: stvGlobalBaseEmote.height,
};

const meta = {
  title: 'components/Chat/EmotePreviewSheet',
  component: EmotePreviewSheet,
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
    selectedEmote,
  },
} satisfies Meta<typeof EmotePreviewSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

type SheetProps = React.ComponentProps<typeof EmotePreviewSheet>;

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
      <EmotePreviewSheet
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
