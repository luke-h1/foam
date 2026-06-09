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
import type { ChannelCacheType } from '@app/store/chat/types/constants';
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

type TabType = 'emotes' | 'badges';

const CHANNEL_TABS: {
  id: TabType;
  label: string;
  color: string;
  emptyMessage: string;
  emptySubmessage: string;
}[] = [
  {
    id: 'emotes',
    label: 'Emotes',
    color: theme.colorPlum,
    emptyMessage: 'No emotes cached',
    emptySubmessage: 'Tap refresh to fetch emotes for this channel',
  },
  {
    id: 'badges',
    label: 'Badges',
    color: theme.colorOrange,
    emptyMessage: 'No badges cached',
    emptySubmessage: 'Tap refresh to fetch badges for this channel',
  },
];

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

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildResourceList<TSource, TRow>(
  cache: ChannelCacheType | undefined,
  sources: (channelCache: ChannelCacheType) => TSource[],
  key: (item: TSource) => string,
  map: (item: TSource) => TRow,
): TRow[] {
  if (!cache) return [];
  return dedupeBy(sources(cache), key).map(map);
}

function buildEmoteList(cache: ChannelCacheType | undefined): EmoteRowItem[] {
  return buildResourceList(
    cache,
    channelCache => [
      ...(channelCache.twitchChannelEmotes ?? []),
      ...(channelCache.twitchGlobalEmotes ?? []),
      ...(channelCache.twitchSubscriberEmotes ?? []),
      ...(channelCache.sevenTvChannelEmotes ?? []),
      ...(channelCache.sevenTvGlobalEmotes ?? []),
      ...(channelCache.ffzChannelEmotes ?? []),
      ...(channelCache.ffzGlobalEmotes ?? []),
      ...(channelCache.bttvChannelEmotes ?? []),
      ...(channelCache.bttvGlobalEmotes ?? []),
    ],
    emote => `${emote.site}:${emote.id}`,
    emote => ({
      id: emote.id,
      name: emote.name,
      url: emote.url,
      site: emote.site,
      creator: emote.creator,
      emote_link: emote.emote_link,
    }),
  );
}

function buildBadgeList(cache: ChannelCacheType | undefined): BadgeRowItem[] {
  return buildResourceList(
    cache,
    channelCache => [
      ...(channelCache.twitchChannelBadges ?? []),
      ...(channelCache.twitchGlobalBadges ?? []),
      ...(channelCache.ffzChannelBadges ?? []),
      ...(channelCache.ffzGlobalBadges ?? []),
      ...(channelCache.chatterinoBadges ?? []),
    ],
    badge => `${badge.type}:${badge.id}`,
    badge => ({
      id: badge.id,
      title: badge.title,
      url: badge.url,
      type: badge.type,
      set: badge.set,
      provider: badge.provider,
    }),
  );
}

function ItemRow({
  url,
  name,
  tag,
  meta,
  detail,
  link,
}: {
  url: string;
  name: string;
  tag?: string;
  meta?: string;
  detail: string;
  link?: string;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: url }}
          style={styles.thumbnail}
          contentFit='contain'
        />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {name}
          </Text>
          {tag ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{tag}</Text>
            </View>
          ) : null}
        </View>
        {meta ? (
          <Text style={styles.itemMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <Text style={styles.itemId} numberOfLines={1} selectable>
          {detail}
        </Text>
        {link ? (
          <Text
            style={styles.itemLink}
            numberOfLines={1}
            onPress={() => void Linking.openURL(link)}
          >
            {link}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const renderEmoteItem: ListRenderItem<EmoteRowItem> = ({ item }) => (
  <ItemRow
    url={item.url}
    name={item.name}
    tag={item.site}
    meta={item.creator ? `by ${item.creator}` : undefined}
    detail={item.id}
    link={item.emote_link || undefined}
  />
);

const renderBadgeItem: ListRenderItem<BadgeRowItem> = ({ item }) => (
  <ItemRow
    url={item.url}
    name={item.title}
    tag={item.provider?.toUpperCase()}
    meta={item.type}
    detail={`set: ${item.set} · id: ${item.id}`}
  />
);

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

function ResourceList<T>({
  ref,
  data,
  renderItem,
  keyExtractor,
  emptyMessage,
  emptySubmessage,
}: {
  ref?: RefObject<FlashListRef<T> | null>;
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  emptyMessage: string;
  emptySubmessage: string;
}) {
  return (
    <FlashList
      ref={ref}
      data={data}
      contentInsetAdjustmentBehavior='automatic'
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <EmptyState message={emptyMessage} submessage={emptySubmessage} />
      }
    />
  );
}

function TabButton({
  label,
  count,
  isActive,
  activeColor,
  onPress,
}: {
  label: string;
  count: number;
  isActive: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      style={[
        styles.tabButton,
        isActive && styles.tabButtonActive,
        isActive && { backgroundColor: activeColor },
      ]}
    >
      <Text
        style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}
      >
        {label} ({count})
      </Text>
    </Button>
  );
}

function FollowedStreamerPill({
  streamer,
  isSelected,
  onPress,
}: {
  streamer: { user_id: string; user_name: string; thumbnail_url: string };
  isSelected: boolean;
  onPress: () => void;
}) {
  const avatarUrl = streamer.thumbnail_url
    .replace('{width}', '40')
    .replace('{height}', '40');

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
        style={[styles.streamerName, isSelected && styles.streamerNameActive]}
        numberOfLines={1}
      >
        {streamer.user_name}
      </Text>
    </TouchableOpacity>
  );
}

function StatusPanel({
  title,
  subtitle,
  actionLabel,
  onAction,
  loading,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.centeredState}>
      {loading ? (
        <ActivityIndicator color={theme.colorPrimary} size='large' />
      ) : null}
      <Text style={loading ? styles.loadingText : styles.emptyText}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.emptySubtext}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Button>
      ) : null}
    </View>
  );
}

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

  const cache = useSelector(() =>
    chatStore$.persisted.channelCaches[channelId]?.get(),
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

  if (!cache && !isLoading && !loaded && !error) {
    void handleLoad();
  }

  if (isLoading) {
    return <StatusPanel title={`Loading ${channelName}…`} loading />;
  }

  if (error) {
    return (
      <StatusPanel
        title='Failed to load channel'
        subtitle={error}
        actionLabel='Retry'
        onAction={handleLoad}
      />
    );
  }

  const activeTabConfig =
    CHANNEL_TABS.find(entry => entry.id === activeTab) ?? CHANNEL_TABS[0];
  const isEmotes = activeTab === 'emotes';

  return (
    <View style={styles.flex}>
      <View style={styles.tabContainer}>
        {CHANNEL_TABS.map(tab => (
          <TabButton
            key={tab.id}
            label={tab.label}
            count={tab.id === 'emotes' ? emoteList.length : badgeList.length}
            isActive={activeTab === tab.id}
            activeColor={tab.color}
            onPress={() => setActiveTab(tab.id)}
          />
        ))}
        {(emoteList.length > 0 || badgeList.length > 0) && (
          <Button onPress={handleLoad} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>↻</Text>
          </Button>
        )}
      </View>

      <ResourceList
        ref={
          listRef as RefObject<FlashListRef<EmoteRowItem | BadgeRowItem> | null>
        }
        data={isEmotes ? emoteList : badgeList}
        renderItem={isEmotes ? renderEmoteItem : renderBadgeItem}
        keyExtractor={item =>
          isEmotes
            ? `${(item as EmoteRowItem).site}:${(item as EmoteRowItem).id}`
            : `${(item as BadgeRowItem).type}:${(item as BadgeRowItem).id}`
        }
        emptyMessage={activeTabConfig.emptyMessage}
        emptySubmessage={activeTabConfig.emptySubmessage}
      />
    </View>
  );
}

export function SettingsEmotesScreen() {
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();

  const [inputValue, setInputValue] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const followedQuery = useQuery({
    ...twitchQueries.getFollowedStreams(user?.id ?? ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectFollowed = useCallback(
    (streamer: { user_id: string; user_login: string; user_name: string }) => {
      setResolveError(null);
      setInputValue(streamer.user_login);
      setSelectedChannel({ id: streamer.user_id, name: streamer.user_name });
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    const login = inputValue.trim().toLowerCase();
    if (!login) return;

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
      setResolveError(
        'Could not find that channel. Check the name and try again.',
      );
    } finally {
      setResolving(false);
    }
  }, [inputValue]);

  const followedStreamers = followedQuery.data ?? [];

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
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
            style={styles.flex}
          />
          <Button
            onPress={handleSearch}
            style={styles.actionButton}
            disabled={resolving || !inputValue.trim()}
          >
            {resolving ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <Text style={styles.actionButtonText}>Go</Text>
            )}
          </Button>
        </View>
        {resolveError ? (
          <Text style={styles.errorText}>{resolveError}</Text>
        ) : null}
      </View>

      {user && followedStreamers.length > 0 && (
        <View style={styles.followedSection}>
          <Text style={styles.followedLabel}>Following</Text>
          <FlashList
            data={followedStreamers}
            horizontal
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

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: 10,
    justifyContent: 'center',
    minWidth: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  centeredState: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  flex: {
    flex: 1,
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
  screen: {
    backgroundColor: theme.color.background.dark,
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
