import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { router } from 'expo-router';

import { Button } from '@app/components/button/button';
import {
  FlashList,
  type ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { useWhisperThreads } from '@app/store/chat/react/whispers';
import type { WhisperThread } from '@app/store/chat/types/whispers';
import { theme } from '@app/styles/themes';
import { normaliseChatText } from '@app/utils/chat/normalise-chat-text';

import { WhisperAvatarRibbon } from './components/whisper-avatar-ribbon';
import { WhisperThreadRow } from './components/whisper-thread-row';
import { openWhisperConversation } from './util/open-whisper-conversation';

type WhisperFilter = 'all' | 'unread';

export function WhispersInboxScreen() {
  const threads = useWhisperThreads();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<WhisperFilter>('all');

  const filtered = useMemo(() => {
    const needle = normaliseChatText(query);

    return threads.filter(thread => {
      if (filter === 'unread' && thread.unreadCount === 0) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = normaliseChatText(
        `${thread.partnerDisplayName} ${thread.partnerLogin}`,
      );

      return haystack.includes(needle);
    });
  }, [filter, query, threads]);

  const openThread = useCallback((thread: WhisperThread) => {
    openWhisperConversation({
      displayName: thread.partnerDisplayName,
      login: thread.partnerLogin,
      userId: thread.partnerUserId,
    });
  }, []);

  const renderThread = useCallback<ListRenderItem<WhisperThread>>(
    ({ item }) => <WhisperThreadRow thread={item} onPress={openThread} />,
    [openThread],
  );

  return (
    <View style={styles.root}>
      <WhisperAvatarRibbon
        threads={threads.slice(0, 12)}
        onPress={openThread}
      />

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder='Search whispers'
          placeholderTextColor={theme.color.textFaint.dark}
          autoCapitalize='none'
          autoCorrect={false}
          clearButtonMode='while-editing'
          style={styles.search}
        />
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='New whisper'
          onPress={() => router.push('/tabs/settings/whispers/compose')}
          style={styles.composeButton}
        >
          <SymbolView
            name='square.and.pencil'
            size={20}
            tintColor={theme.colorWhite}
          />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {(['all', 'unread'] as const).map(tab => (
          <Pressable
            key={tab}
            onPress={() => setFilter(tab)}
            style={[
              styles.filterChip,
              filter === tab && styles.filterChipActive,
            ]}
          >
            <Text
              type='footnote'
              weight='semibold'
              style={
                filter === tab ? styles.filterTextActive : styles.filterText
              }
            >
              {tab === 'all' ? 'All' : 'Unread'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlashList
        data={filtered}
        keyExtractor={item => item.partnerLogin}
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.listContent}
        renderItem={renderThread}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text type='headline' style={styles.emptyTitle}>
              {query ? 'No conversations found' : 'No whispers'}
            </Text>
            <Text type='body' color='gray.textLow' style={styles.emptyBody}>
              {query
                ? 'Try a different name.'
                : 'Whispers you send or receive while Foam is open show up here.'}
            </Text>
            {!query ? (
              <Button
                onPress={() => router.push('/tabs/settings/whispers/compose')}
                style={styles.emptyAction}
              >
                <Text
                  type='callout'
                  weight='semibold'
                  style={styles.emptyActionText}
                >
                  New whisper
                </Text>
              </Button>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  search: {
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: 12,
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  composeButton: {
    alignItems: 'center',
    backgroundColor: theme.color.accent.dark,
    borderCurve: 'continuous',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: theme.color.surfacePressed.dark,
  },
  filterText: {
    color: theme.color.textSecondary.dark,
  },
  filterTextActive: {
    color: theme.color.text.dark,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 8,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    color: theme.color.text.dark,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
  },
  emptyAction: {
    backgroundColor: theme.color.accent.dark,
    borderCurve: 'continuous',
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyActionText: {
    color: theme.color.onAccent.dark,
  },
});
