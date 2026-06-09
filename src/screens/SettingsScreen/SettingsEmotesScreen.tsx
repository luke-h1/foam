import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { Button } from '@app/components/Button/Button';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type {
  SanitisedBadgeSet,
  SanitisedEmote,
} from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';
import { useSelector } from '@legendapp/state/react';
import { useRef, useState, type RefObject } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

type TabType = 'emotes' | 'badges';

interface EmoteRowItem {
  id: string;
  name: string;
  url: string;
  site: string;
  creator: string | null;
  emote_link: string;
}

interface BadgeRowItem {
  id: string;
  title: string;
  url: string;
  type: string;
  set: string;
  provider?: string;
}

function buildEmoteList(
  channelCaches: Record<string, import('@app/store/chat/types/constants').ChannelCacheType>,
): EmoteRowItem[] {
  const seen = new Set<string>();
  const results: EmoteRowItem[] = [];

  for (const cache of Object.values(channelCaches)) {
    const allEmotes: SanitisedEmote[] = [
      ...(cache.twitchChannelEmotes ?? []),
      ...(cache.twitchGlobalEmotes ?? []),
      ...(cache.twitchSubscriberEmotes ?? []),
      ...(cache.sevenTvChannelEmotes ?? []),
      ...(cache.sevenTvGlobalEmotes ?? []),
      ...(cache.ffzChannelEmotes ?? []),
      ...(cache.ffzGlobalEmotes ?? []),
      ...(cache.bttvChannelEmotes ?? []),
      ...(cache.bttvGlobalEmotes ?? []),
    ];

    for (const emote of allEmotes) {
      const key = `${emote.site}:${emote.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: emote.id,
          name: emote.name,
          url: emote.url,
          site: emote.site,
          creator: emote.creator,
          emote_link: emote.emote_link,
        });
      }
    }
  }

  return results;
}

function buildBadgeList(
  channelCaches: Record<string, import('@app/store/chat/types/constants').ChannelCacheType>,
): BadgeRowItem[] {
  const seen = new Set<string>();
  const results: BadgeRowItem[] = [];

  for (const cache of Object.values(channelCaches)) {
    const allBadges: SanitisedBadgeSet[] = [
      ...(cache.twitchChannelBadges ?? []),
      ...(cache.twitchGlobalBadges ?? []),
      ...(cache.ffzChannelBadges ?? []),
      ...(cache.ffzGlobalBadges ?? []),
      ...(cache.chatterinoBadges ?? []),
    ];

    for (const badge of allBadges) {
      const key = `${badge.type}:${badge.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: badge.id,
          title: badge.title,
          url: badge.url,
          type: badge.type,
          set: badge.set,
          provider: badge.provider,
        });
      }
    }
  }

  return results;
}

// ─── Row renderers ────────────────────────────────────────────────────────────

const renderEmoteItem: ListRenderItem<EmoteRowItem> = ({ item }) => (
  <View style={styles.item}>
    <View style={styles.thumbnailContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.thumbnail}
        contentFit='contain'
      />
    </View>
    <View style={styles.itemInfo}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.siteBadge}>
          <Text style={styles.siteBadgeText}>{item.site}</Text>
        </View>
      </View>
      {item.creator ? (
        <Text style={styles.itemMeta} numberOfLines={1}>
          by {item.creator}
        </Text>
      ) : null}
      <Text style={styles.itemId} numberOfLines={1} selectable>
        {item.id}
      </Text>
      {item.emote_link ? (
        <Text
          style={styles.itemLink}
          numberOfLines={1}
          onPress={() => Linking.openURL(item.emote_link)}
        >
          {item.emote_link}
        </Text>
      ) : null}
    </View>
  </View>
);

const renderBadgeItem: ListRenderItem<BadgeRowItem> = ({ item }) => (
  <View style={styles.item}>
    <View style={styles.thumbnailContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.thumbnail}
        contentFit='contain'
      />
    </View>
    <View style={styles.itemInfo}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.title}
        </Text>
        {item.provider ? (
          <View style={styles.siteBadge}>
            <Text style={styles.siteBadgeText}>
              {item.provider.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.itemMeta} numberOfLines={1}>
        {item.type}
      </Text>
      <Text style={styles.itemId} numberOfLines={1} selectable>
        set: {item.set} · id: {item.id}
      </Text>
    </View>
  </View>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  message,
  submessage,
}: {
  message: string;
  submessage: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>{submessage}</Text>
    </View>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function TabContent({
  activeTab,
  emoteList,
  badgeList,
  listRef,
}: {
  activeTab: TabType;
  emoteList: EmoteRowItem[];
  badgeList: BadgeRowItem[];
  listRef: RefObject<FlashListRef<EmoteRowItem> | null>;
}) {
  if (activeTab === 'emotes') {
    return (
      <FlashList
        ref={listRef}
        data={emoteList}
        estimatedItemSize={90}
        contentInsetAdjustmentBehavior='automatic'
        renderItem={renderEmoteItem}
        keyExtractor={item => `${item.site}:${item.id}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            message='No cached emotes'
            submessage='Emotes will appear here after you visit a stream chat'
          />
        }
      />
    );
  }

  return (
    <FlashList
      ref={listRef as RefObject<FlashListRef<BadgeRowItem> | null>}
      data={badgeList}
      estimatedItemSize={90}
      contentInsetAdjustmentBehavior='automatic'
      renderItem={renderBadgeItem}
      keyExtractor={item => `${item.type}:${item.id}`}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <EmptyState
          message='No cached badges'
          submessage='Badges will appear here after you visit a stream chat'
        />
      }
    />
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  activeTab,
  emoteCount,
  badgeCount,
  onSelectTab,
}: {
  activeTab: TabType;
  emoteCount: number;
  badgeCount: number;
  onSelectTab: (tab: TabType) => void;
}) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.tabContainer}>
        <Button
          onPress={() => onSelectTab('emotes')}
          style={[
            styles.tabButton,
            activeTab === 'emotes' && styles.tabButtonActive,
            activeTab === 'emotes' && { backgroundColor: theme.colorPlum },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'emotes' && styles.tabButtonTextActive,
            ]}
          >
            Emotes ({emoteCount})
          </Text>
        </Button>
        <Button
          onPress={() => onSelectTab('badges')}
          style={[
            styles.tabButton,
            activeTab === 'badges' && styles.tabButtonActive,
            activeTab === 'badges' && { backgroundColor: theme.colorOrange },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'badges' && styles.tabButtonTextActive,
            ]}
          >
            Badges ({badgeCount})
          </Text>
        </Button>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsEmotesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('emotes');
  const listRef = useRef<FlashListRef<EmoteRowItem>>(null);

  useScrollToTop(listRef);

  const channelCaches = useSelector(
    chatStore$.persisted.channelCaches,
  );

  const emoteList = buildEmoteList(channelCaches);
  const badgeList = buildBadgeList(channelCaches);

  return (
    <View style={styles.screenContainer}>
      <View style={styles.container}>
        <Header
          activeTab={activeTab}
          emoteCount={emoteList.length}
          badgeCount={badgeList.length}
          onSelectTab={setActiveTab}
        />
        <TabContent
          activeTab={activeTab}
          emoteList={emoteList}
          badgeList={badgeList}
          listRef={listRef}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptySubtext: {
    color: theme.color.textSecondary.dark,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.8,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.color.textSecondary.dark,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  headerContainer: {
    backgroundColor: theme.color.background.dark,
    paddingBottom: 8,
  },
  item: {
    alignItems: 'flex-start',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    padding: 16,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  itemId: {
    color: theme.color.textSecondary.dark,
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  itemInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 4,
  },
  itemLink: {
    color: theme.colorBlue,
    fontSize: 11,
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  itemMeta: {
    color: theme.color.textSecondary.dark,
    fontSize: 12,
    fontWeight: '500',
  },
  itemName: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  listContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  screenContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  siteBadge: {
    backgroundColor: theme.color.background.dark,
    borderCurve: 'continuous',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  siteBadgeText: {
    color: theme.color.textSecondary.dark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabButtonActive: {
    borderColor: 'transparent',
  },
  tabButtonText: {
    color: theme.color.text.dark,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  thumbnail: {
    borderCurve: 'continuous',
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  thumbnailContainer: {
    backgroundColor: theme.color.background.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    overflow: 'hidden',
  },
});
