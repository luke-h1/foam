import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { Button } from '@app/components/Button/Button';
import { Input } from '@app/components/ui/Input/Input';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useAuthContext } from '@app/context/AuthContext';
import { twitchQueries } from '@app/queries/twitchQueries';
import { twitchService } from '@app/services/twitch-service';
import { loadChannelResources } from '@app/store/chat/actions/channelLoad';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type {
  ChannelCacheType,
  SanitisedBadgeSet,
  SanitisedEmote,
} from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';
import { useSelector } from '@legendapp/state/react';
import { useQuery } from '@tanstack/react-query';
import {
  useCallback,
  useRef,
  useState,
  startTransition,
  type RefObject,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildEmoteList(cache: ChannelCacheType | undefined): EmoteRowItem[] {
  if (!cache) {
    return [];
  }

  const seen = new Set<string>();
  const results: EmoteRowItem[] = [];

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

  return results;
}

function buildBadgeList(cache: ChannelCacheType | undefined): BadgeRowItem[] {
  if (!cache) {
    return [];
  }

  const seen = new Set<string>();
  const results: BadgeRowItem[] = [];

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
        <View style={styles.tagBadge}>
          <Text style={styles.tagBadgeText}>{item.site}</Text>
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
          onPress={() => void Linking.openURL(item.emote_link)}
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
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>
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

// ─── Empty / error states ─────────────────────────────────────────────────────

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

// ─── Followed streamer pill ───────────────────────────────────────────────────

interface FollowedStreamer {
  user_id: string;
  user_login: string;
  user_name: string;
  thumbnail_url: string;
}

function FollowedStreamerPill({
  streamer,
  isSelected,
  onPress,
}: {
  streamer: FollowedStreamer;
  isSelected: boolean;
  onPress: () => void;
}) {
  const avatarUrl = streamer.thumbnail_url.replace('{width}', '40').replace('{height}', '40');
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.streamerPill, isSelected && styles.streamerPillActive]}
      activeOpacity={0.75}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={styles.streamerAvatar}
        contentFit='cover'
      />
      <Text
        style={[
          styles.streamerName,
          isSelected && styles.streamerNameActive,
        ]}
        numberOfLines={1}
      >
        {streamer.user_name}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Channel viewer (after channel is resolved) ───────────────────────────────

function ChannelViewer({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('emotes');
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlashListRef<EmoteRowItem>>(null);

  useScrollToTop(listRef);

  const cache = useSelector(
    () => chatStore$.persisted.channelCaches[channelId]?.get(),
  );

  const emoteList = buildEmoteList(cache);
  const badgeList = buildBadgeList(cache);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loadChannelResources({ channelId, forceRefresh: true });
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load channel');
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  const hasCache = cache !== undefined;
  const hasContent = emoteList.length > 0 || badgeList.length > 0;

  // Auto-load if no cache yet
  if (!hasCache && !isLoading && !loaded && !error) {
    void handleLoad();
  }

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={theme.colorPrimary} size='large' />
        <Text style={styles.loadingText}>Loading {channelName}…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.emptyText}>Failed to load channel</Text>
        <Text style={styles.emptySubtext}>{error}</Text>
        <Button onPress={handleLoad} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.channelViewerContainer}>
      {/* Tab bar */}
      <View style={styles.tabContainer}>
        <Button
          onPress={() => setActiveTab('emotes')}
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
            Emotes ({emoteList.length})
          </Text>
        </Button>
        <Button
          onPress={() => setActiveTab('badges')}
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
            Badges ({badgeList.length})
          </Text>
        </Button>
        {hasContent && (
          <Button
            onPress={handleLoad}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>↻</Text>
          </Button>
        )}
      </View>

      {/* List */}
      {activeTab === 'emotes' ? (
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
              message='No emotes cached'
              submessage='Tap refresh to fetch emotes for this channel'
            />
          }
        />
      ) : (
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
              message='No badges cached'
              submessage='Tap refresh to fetch badges for this channel'
            />
          }
        />
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SettingsEmotesScreen() {
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();

  // Channel search state
  const [inputValue, setInputValue] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Followed streamers (only when logged in)
  const followedQuery = useQuery({
    ...twitchQueries.getFollowedStreams(user?.id ?? ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const followedStreamers: FollowedStreamer[] = (followedQuery.data ?? []).map(
    s => ({
      user_id: s.user_id,
      user_login: s.user_login,
      user_name: s.user_name,
      thumbnail_url: s.thumbnail_url,
    }),
  );

  const handleSelectFollowed = useCallback(
    (streamer: FollowedStreamer) => {
      setResolveError(null);
      setInputValue(streamer.user_login);
      setSelectedChannel({ id: streamer.user_id, name: streamer.user_name });
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    const login = inputValue.trim().toLowerCase();
    if (!login) {
      return;
    }

    setResolving(true);
    setResolveError(null);
    setSelectedChannel(null);

    try {
      const userInfo = await twitchService.getUser(login);
      if (!userInfo?.id) {
        setResolveError(`Channel "${login}" not found`);
        return;
      }
      startTransition(() => {
        setSelectedChannel({ id: userInfo.id, name: userInfo.display_name });
      });
    } catch {
      setResolveError('Could not find that channel. Check the name and try again.');
    } finally {
      setResolving(false);
    }
  }, [inputValue]);

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* Search bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Input
            autoCapitalize='none'
            autoCorrect={false}
            placeholder='Enter channel name…'
            value={inputValue}
            onChangeText={text => {
              setInputValue(text);
              setResolveError(null);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType='search'
            style={styles.searchInput}
          />
          <Button
            onPress={handleSearch}
            style={styles.searchButton}
            disabled={resolving || !inputValue.trim()}
          >
            {resolving ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <Text style={styles.searchButtonText}>Go</Text>
            )}
          </Button>
        </View>
        {resolveError ? (
          <Text style={styles.errorText}>{resolveError}</Text>
        ) : null}
      </View>

      {/* Followed streamers */}
      {user && followedStreamers.length > 0 && (
        <View style={styles.followedSection}>
          <Text style={styles.followedLabel}>Following</Text>
          <FlashList
            data={followedStreamers}
            horizontal
            estimatedItemSize={100}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.followedListContent}
            keyExtractor={item => item.user_id}
            renderItem={({ item }) => (
              <FollowedStreamerPill
                streamer={item}
                isSelected={selectedChannel?.id === item.user_id}
                onPress={() => handleSelectFollowed(item)}
              />
            )}
          />
        </View>
      )}

      {/* Viewer */}
      {selectedChannel ? (
        <ChannelViewer
          key={selectedChannel.id}
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {user
              ? 'Pick a followed channel or search by name'
              : 'Search for a channel by name'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centeredState: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  channelViewerContainer: {
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
    textAlign: 'center',
  },
  errorText: {
    color: theme.colorRed,
    fontSize: 13,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  followedLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  followedListContent: {
    paddingHorizontal: 16,
  },
  followedSection: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    paddingTop: 4,
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
  loadingText: {
    color: theme.color.textSecondary.dark,
    fontSize: 14,
    marginTop: 12,
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  placeholderText: {
    color: theme.color.textSecondary.dark,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.7,
    textAlign: 'center',
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: theme.color.text.dark,
    fontSize: 16,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  screen: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: 10,
    justifyContent: 'center',
    minWidth: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  searchSection: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  streamerAvatar: {
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 32,
    width: 32,
  },
  streamerName: {
    color: theme.color.text.dark,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 72,
  },
  streamerNameActive: {
    color: '#fff',
  },
  streamerPill: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 88,
  },
  streamerPillActive: {
    backgroundColor: theme.colorTeal,
    borderColor: 'transparent',
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
  tagBadge: {
    backgroundColor: theme.color.background.dark,
    borderCurve: 'continuous',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tagBadgeText: {
    color: theme.color.textSecondary.dark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
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
