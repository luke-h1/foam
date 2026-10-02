import { use, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  type SectionListData,
  type SectionListRenderItemInfo,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LegendListRenderItemProps } from '@legendapp/list/react-native';
import { LegendList } from '@legendapp/list/react-native';
import { SectionList as LegendSectionList } from '@legendapp/list/section-list';
import { useQuery } from '@tanstack/react-query';
import { HeaderHeightContext } from 'expo-router/build/react-navigation/elements';

import { Button } from '@app/components/button/button';
import { BadgePreviewSheet } from '@app/components/chat/components/badge-preview-sheet/badge-preview-sheet';
import { EmotePreviewSheet } from '@app/components/chat/components/emote-preview-sheet/emote-preview-sheet';
import { EmoteRow } from '@app/components/chat/components/emote-sheet/emote-row';
import { ProviderChip } from '@app/components/chat/components/emote-sheet/provider-chip';
import { SetHeader } from '@app/components/chat/components/emote-sheet/set-header';
import {
  buildEmoteMenuProviders,
  type EmoteMenuListItem,
  type EmoteMenuProviderId,
  filterProviderSets,
  flattenProviderSets,
} from '@app/components/chat/components/emote-sheet/util/emote-menu-data';
import { EMOTE_CELL_GAP } from '@app/components/chat/components/emote-sheet/util/emote-sheet-layout';
import type { EmotePickerItem } from '@app/components/chat/components/emote-sheet/util/emote-sheet-types';
import { Image } from '@app/components/image/image';
import { SegmentedControl } from '@app/components/segmented-control/segmented-control';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { Text } from '@app/components/ui/text/text';
import { sevenTvBadgesQueryOptions } from '@app/lib/react-query/queries/emotes';
import { ChannelField } from '@app/screens/settings-screen/components/channel-field';
import { EmoteBadgeViewerLoader } from '@app/screens/settings-screen/components/emote-badge-viewer-loader';
import {
  type ChannelEmoteResources,
  useChannelEmoteResources,
} from '@app/screens/settings-screen/hooks/use-channel-emote-resources';
import { fitGrid } from '@app/screens/settings-screen/util/fit-grid';
import { ensureGlobalChatResources } from '@app/store/chat/actions/global-resource-ensure';
import { useGlobalEmoteBadgeCaches } from '@app/store/chat/react/selectors';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import {
  type BadgeProviderSection,
  type BadgeRow,
  groupBadgesByProvider,
} from '@app/utils/chat/group-badges-by-provider';
import type { MessageToken } from '@app/utils/chat/message-token';

const BADGE_CELL_SIZE = 64;
const BADGE_IMAGE_SIZE = 40;

const getBadgeRowKey = (row: BadgeRow, index: number) =>
  `${row.map(badge => `${badge.provider ?? 'twitch'}-${badge.id}`).join('|')}-${index}`;

function toEmotePart(emote: SanitisedEmote): MessageToken<'emote'> {
  return { ...emote, type: 'emote', content: emote.name };
}

interface EmotesTabProps {
  channelResources: ChannelEmoteResources | undefined;
  onSelectEmote: (emote: SanitisedEmote) => void;
}

function EmotesTab({ channelResources, onSelectEmote }: EmotesTabProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const grid = fitGrid({
    width: width - theme.space16 * 2,
    targetCell: 56,
    gap: EMOTE_CELL_GAP,
  });
  const caches = useGlobalEmoteBadgeCaches();
  const [ensureSettled, setEnsureSettled] = useState(false);

  useEffect(() => {
    ensureGlobalChatResources().finally(() => setEnsureSettled(true));
  }, []);

  const isLoading =
    !ensureSettled &&
    caches.twitchGlobalEmotes.length === 0 &&
    caches.sevenTvGlobalEmotes.length === 0 &&
    caches.bttvGlobalEmotes.length === 0 &&
    caches.ffzGlobalEmotes.length === 0;

  const [activeProviderId, setActiveProviderId] =
    useState<EmoteMenuProviderId | null>(null);

  const providers = useMemo(
    () =>
      buildEmoteMenuProviders({
        bttvChannelEmotes: channelResources?.bttvChannelEmotes,
        bttvGlobalEmotes: caches.bttvGlobalEmotes,
        ffzChannelEmotes: channelResources?.ffzChannelEmotes,
        ffzGlobalEmotes: caches.ffzGlobalEmotes,
        sevenTvChannelEmotes: channelResources?.sevenTvChannelEmotes,
        sevenTvGlobalEmotes: caches.sevenTvGlobalEmotes,
        twitchChannelEmotes: channelResources?.twitchChannelEmotes,
        twitchGlobalEmotes: caches.twitchGlobalEmotes,
      }),
    [
      channelResources,
      caches.bttvGlobalEmotes,
      caches.ffzGlobalEmotes,
      caches.sevenTvGlobalEmotes,
      caches.twitchGlobalEmotes,
    ],
  );

  const effectiveActiveProviderId =
    activeProviderId &&
    providers.some(provider => provider.id === activeProviderId)
      ? activeProviderId
      : (providers[0]?.id ?? null);

  const activeProvider = providers.find(
    provider => provider.id === effectiveActiveProviderId,
  );

  const filteredSets = useMemo(
    () => filterProviderSets(activeProvider, ''),
    [activeProvider],
  );

  const { items: listItems } = useMemo(
    () => flattenProviderSets(filteredSets, grid.columns),
    [filteredSets, grid.columns],
  );

  const handleEmotePress = useCallback(
    (item: EmotePickerItem) => {
      if (item instanceof Object) {
        onSelectEmote(item);
      }
    },
    [onSelectEmote],
  );

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<EmoteMenuListItem>) => {
      if (item.type === 'header') {
        const set = filteredSets.find(entry => entry.id === item.setId);
        return set ? <SetHeader set={set} /> : null;
      }

      return (
        <EmoteRow
          cellSize={grid.cellSize}
          items={item.items ?? []}
          onPress={handleEmotePress}
        />
      );
    },
    [filteredSets, grid.cellSize, handleEmotePress],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <EmoteBadgeViewerLoader />
      </View>
    );
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        iconName='face.smiling'
        heading='No emotes found'
        content='Emote sets load from Twitch, 7TV, BTTV and FFZ. Check your connection.'
      />
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.providerChipRow}
        contentContainerStyle={styles.providerChipRowContent}
      >
        {/* eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- bounded set of provider tabs */}
        {providers.map(provider => (
          <ProviderChip
            key={provider.id}
            isActive={provider.id === effectiveActiveProviderId}
            onSelect={setActiveProviderId}
            provider={provider}
          />
        ))}
      </ScrollView>

      <LegendList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        getItemType={item => item.type}
        estimatedItemSize={60}
        recycleItems
        indicatorStyle={Platform.OS === 'ios' ? 'white' : undefined}
        contentContainerStyle={[
          styles.emoteListContent,
          { paddingBottom: bottomInset + theme.space36 },
        ]}
        style={styles.flex}
      />
    </View>
  );
}

interface BadgeCellProps {
  badge: SanitisedBadgeSet;
  size: number;
  onPress: (badge: SanitisedBadgeSet) => void;
}

function BadgeCell({ badge, size, onPress }: BadgeCellProps) {
  return (
    <Button
      testID={`badge-cell-${badge.id}`}
      style={[styles.badgeCell, { height: size, width: size }]}
      onPress={() => onPress(badge)}
    >
      <Image
        source={badge.url}
        cacheVariant='badge'
        contentFit='contain'
        transition={0}
        style={styles.badgeImage}
      />
    </Button>
  );
}

function BadgeRowView({
  row,
  size,
  onPress,
}: {
  row: BadgeRow;
  size: number;
  onPress: (badge: SanitisedBadgeSet) => void;
}) {
  return (
    <View style={styles.badgeRow}>
      {row.map(badge => (
        <BadgeCell
          key={`${badge.provider ?? 'twitch'}-${badge.id}`}
          badge={badge}
          size={size}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

function BadgeSectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.badgeSectionHeader}>
      <Text type='body' weight='semibold' style={styles.badgeSectionTitle}>
        {title}
      </Text>
    </View>
  );
}

interface BadgesTabProps {
  channelBadges: SanitisedBadgeSet[] | undefined;
  onSelectBadge: (badge: SanitisedBadgeSet) => void;
}

function BadgesTab({ channelBadges, onSelectBadge }: BadgesTabProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const grid = fitGrid({
    width: width - theme.space16 * 2,
    targetCell: BADGE_CELL_SIZE,
    gap: theme.space8,
  });
  const { twitchGlobalBadges } = useGlobalEmoteBadgeCaches();
  const [ensureSettled, setEnsureSettled] = useState(false);

  useEffect(() => {
    ensureGlobalChatResources().finally(() => setEnsureSettled(true));
  }, []);

  const twitchLoading = !ensureSettled && twitchGlobalBadges.length === 0;

  const { data: sevenTvBadges, isLoading: sevenTvLoading } = useQuery(
    sevenTvBadgesQueryOptions(),
  );

  // Channel badges first, so a chosen channel's own badges lead the list.
  const badges = useMemo(
    () => [
      ...(channelBadges ?? []),
      ...twitchGlobalBadges,
      ...(sevenTvBadges ?? []),
    ],
    [channelBadges, twitchGlobalBadges, sevenTvBadges],
  );

  const sections = useMemo(
    () => groupBadgesByProvider(badges, grid.columns),
    [badges, grid.columns],
  );

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<BadgeRow, BadgeProviderSection>) => (
      <BadgeRowView row={item} size={grid.cellSize} onPress={onSelectBadge} />
    ),
    [grid.cellSize, onSelectBadge],
  );

  const renderSectionHeader = useCallback(
    ({
      section,
    }: {
      section: SectionListData<BadgeRow, BadgeProviderSection>;
    }) => <BadgeSectionHeader title={section.title} />,
    [],
  );

  if (twitchLoading || (badges.length === 0 && sevenTvLoading)) {
    return (
      <View style={styles.centered}>
        <EmoteBadgeViewerLoader />
      </View>
    );
  }

  if (badges.length === 0) {
    return (
      <EmptyState
        iconName='checkmark.seal'
        heading='No badges found'
        content='Global badges load from Twitch and 7TV. Check your connection.'
      />
    );
  }

  return (
    <LegendSectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={getBadgeRowKey}
      stickySectionHeadersEnabled
      estimatedItemSize={BADGE_CELL_SIZE + theme.space8}
      recycleItems
      indicatorStyle={Platform.OS === 'ios' ? 'white' : undefined}
      contentContainerStyle={[
        styles.badgeListContent,
        { paddingBottom: bottomInset + theme.space36 },
      ]}
      style={styles.flex}
    />
  );
}

export function EmoteBadgeViewerScreen() {
  const { top: topInset } = useSafeAreaInsets();

  // The context is empty outside a navigator (tests, previews); fall back to
  // the status bar plus a standard bar.
  const headerHeight = use(HeaderHeightContext) ?? topInset + 44;
  const [tabIndex, setTabIndex] = useState(0);
  const [channelLogin, setChannelLogin] = useState<string | null>(null);
  const channel = useChannelEmoteResources(channelLogin);

  const [selectedEmote, setSelectedEmote] =
    useState<MessageToken<'emote'> | null>(null);

  const [selectedBadge, setSelectedBadge] = useState<SanitisedBadgeSet | null>(
    null,
  );

  const handleSelectEmote = useCallback((emote: SanitisedEmote) => {
    setSelectedEmote(toEmotePart(emote));
  }, []);

  return (
    <View
      style={[
        styles.container,
        // The iOS header is transparent, so the content starts below it. The
        // real height tracks large titles and larger text sizes.
        Platform.OS === 'ios' && { paddingTop: headerHeight },
      ]}
    >
      <View style={styles.segmentWrap}>
        <SegmentedControl
          items={[{ label: 'Emotes' }, { label: 'Badges' }]}
          currentIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      <ChannelField
        channelLogin={channelLogin}
        channelName={channel.channel?.display_name}
        isLoading={channel.isLoading}
        isChannelMissing={channel.isChannelMissing}
        isError={channel.isError}
        onChangeChannel={setChannelLogin}
      />

      {tabIndex === 0 ? (
        <EmotesTab
          channelResources={channel.resources}
          onSelectEmote={handleSelectEmote}
        />
      ) : (
        <BadgesTab
          channelBadges={channel.resources?.channelBadges}
          onSelectBadge={setSelectedBadge}
        />
      )}

      {selectedEmote ? (
        <EmotePreviewSheet
          visible
          onClose={() => setSelectedEmote(null)}
          selectedEmote={selectedEmote}
        />
      ) : null}

      {selectedBadge ? (
        <BadgePreviewSheet
          visible
          onClose={() => setSelectedBadge(null)}
          selectedBadge={selectedBadge}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeCell: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    justifyContent: 'center',
  },
  badgeImage: {
    height: BADGE_IMAGE_SIZE,
    width: BADGE_IMAGE_SIZE,
  },
  badgeListContent: {
    paddingTop: theme.space4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.space8,
    marginBottom: theme.space8,
    paddingHorizontal: theme.space16,
  },
  badgeSectionHeader: {
    backgroundColor: theme.color.background.dark,
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
  badgeSectionTitle: {
    color: theme.color.text.dark,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space28,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  emoteListContent: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space4,
  },
  flex: {
    flex: 1,
  },
  providerChipRow: {
    flexGrow: 0,
  },
  providerChipRowContent: {
    gap: theme.space4,
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space12,
  },
  segmentWrap: {
    paddingBottom: theme.space12,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
});
