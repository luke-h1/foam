import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';

import { Avatar } from '@app/components/avatar/avatar';
import { Button } from '@app/components/button/button';
import { useWhispers } from '@app/components/chat/hooks/use-whispers';
import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { impact } from '@app/lib/haptics';
import { markWhisperThreadRead } from '@app/store/chat/actions/whispers';
import { useWhisperThread } from '@app/store/chat/react/whispers';
import type { WhisperMessage } from '@app/store/chat/types/whispers';
import { theme } from '@app/styles/themes';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';

import { WhisperBubble } from './components/whisper-bubble';

export function WhispersConversationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    displayName?: string;
    login: string;
    userId?: string;
  }>();

  const login = normaliseChatUsername(params.login);
  const displayName = params.displayName?.trim() || login;
  const userId = params.userId?.trim() || '';

  const thread = useWhisperThread(login);
  const { sendWhisper } = useWhispers();
  const listRef = useRef<FlashListRef<WhisperMessage>>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const partnerUserId = thread?.partnerUserId || userId;
  const messages = thread?.messages ?? [];

  useEffect(() => {
    if (!login) {
      return;
    }

    markWhisperThreadRead(login);
  }, [login, messages.length]);

  const renderMessage = useCallback<ListRenderItem<WhisperMessage>>(
    ({ item }) => <WhisperBubble message={item} />,
    [],
  );

  const handleSend = useCallback(async () => {
    const body = draft.trim();

    if (!body || isSending || !partnerUserId || !login) {
      return;
    }

    setIsSending(true);

    const sent = await sendWhisper(
      {
        userId: partnerUserId,
        login,
        displayName,
      },
      body,
    );

    setIsSending(false);

    if (sent) {
      setDraft('');
      impact('light');
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
      return;
    }

    toast.error(
      'Could not send whisper. Twitch needs a verified phone number on your account.',
    );
  }, [displayName, draft, isSending, login, partnerUserId, sendWhisper]);

  const canSend = Boolean(draft.trim() && partnerUserId && !isSending);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Avatar
          uri={thread?.partnerProfileImageUrl}
          name={displayName}
          size={36}
        />
        <Text type='headline' numberOfLines={1} style={styles.headerName}>
          {displayName}
        </Text>
      </View>

      <FlashList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => {
          listRef.current?.scrollToEnd({ animated: false });
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text type='body' color='gray.textLow' style={styles.emptyText}>
              Messages stay for this session only.
            </Text>
          </View>
        }
        renderItem={renderMessage}
      />

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={
              partnerUserId ? 'Message…' : 'Need their Twitch user id to send'
            }
            placeholderTextColor={theme.color.textFaint.dark}
            editable={Boolean(partnerUserId) && !isSending}
            multiline
            maxLength={500}
            style={styles.input}
          />
          <Button
            accessibilityLabel='Send whisper'
            disabled={!canSend}
            onPress={() => {
              void handleSend();
            }}
            style={[styles.send, !canSend && styles.sendDisabled]}
          >
            <SymbolView
              name='arrow.up'
              size={18}
              tintColor={theme.color.onAccent.dark}
            />
          </Button>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerName: {
    flex: 1,
    minWidth: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingTop: 16,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: theme.color.background.dark,
    borderTopColor: theme.color.border.dark,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  input: {
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: 20,
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    minHeight: 44,
    paddingBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 11,
  },
  send: {
    alignItems: 'center',
    backgroundColor: theme.color.accent.dark,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
