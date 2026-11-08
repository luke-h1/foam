import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type { Meta, StoryObj } from '@storybook/react';

import { theme } from '@app/styles/themes';

import type { ChatComposerHandle } from './chat-composer/hooks/use-chat-composer-controller';
import { ChatInputSection } from './ChatInputSection';
import type { ChatInputSectionProps } from './ChatInputSection.types';

type HarnessProps = Omit<ChatInputSectionProps, 'inputRef'> & {
  seedText?: string;
};

function ChatInputSectionHarness({ seedText, ...props }: HarnessProps) {
  const inputRef = useRef<ChatComposerHandle | null>(null);
  const [messageInput, setMessageInput] = useState(seedText ?? '');

  useEffect(() => {
    if (seedText) {
      inputRef.current?.setText(seedText);
    }
  }, [seedText]);

  return (
    <ChatInputSection
      {...props}
      inputRef={inputRef}
      messageInput={messageInput}
      onChangeText={setMessageInput}
    />
  );
}

function StoryStage({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: theme.colorBlack,
        flex: 1,
        justifyContent: 'flex-end',
      }}
    >
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        {children}
      </KeyboardStickyView>
    </View>
  );
}

const meta = {
  title: 'components/Chat/ChatInputSection',
  component: ChatInputSectionHarness,
  decorators: [
    Story => (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StoryStage>
            <Story />
          </StoryStage>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    ),
  ],
  args: {
    isAuthenticated: true,
    messageInput: '',
    onAttachImage: () => {},
    onChangeText: () => {},
    onClearReply: () => {},
    onOpenEmoteSheet: () => {},
    onOpenSettingsSheet: () => {},
    onSubmit: () => {},
    replyTo: null,
  },
} satisfies Meta<typeof ChatInputSectionHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithText: Story = {
  args: {
    seedText: 'that clip was actually insane',
  },
};

export const NearCharacterLimit: Story = {
  args: {
    seedText: 'a'.repeat(470),
  },
};

export const OverCharacterLimit: Story = {
  args: {
    seedText: 'a'.repeat(520),
  },
};

export const Replying: Story = {
  args: {
    replyTo: {
      color: '#8A4FFF',
      message: 'no way he hit that shot from across the map',
      messageId: 'story-reply',
      replyParentUserLogin: 'somelongchattername',
      userId: '12345',
      username: 'somelongchattername',
    },
    seedText: 'he does that every single game',
  },
};

export const SignedOut: Story = {
  args: {
    isAuthenticated: false,
  },
};

export const UploadingImage: Story = {
  args: {
    isUploadingImage: true,
    seedText: 'one sec',
  },
};
