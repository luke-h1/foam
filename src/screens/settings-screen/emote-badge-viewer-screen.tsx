import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  type SectionListData,
  type SectionListRenderItemInfo,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LegendListRenderItemProps } from '@legendapp/list/react-native';
import { LegendList } from '@legendapp/list/react-native';
import { SectionList as LegendSectionList } from '@legendapp/list/section-list';
import { useQuery } from '@tanstack/react-query';

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
import type { EmotePickerItem } from '@app/components/chat/components/emote-sheet/util/emote-sheet-types';
import { Image } from '@app/components/image/image';
import { SegmentedControl } from '@app/components/segmented-control/segmented-control';
import { Text } from '@app/components/ui/text/text';
import { sevenTvBadgesQueryOptions } from '@app/lib/react-query/queries/emotes';
import { EmoteBadgeViewerLoader } from '@app/screens/settings-screen/components/emote-badge-viewer-loader';
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
import type { ParsedPart } from '@app/utils/chat/parsed-part';

const BADGE_CELL_SIZE = 64;
const BADGE_IMAGE_SIZE = 40;

const getBadgeRowKey = (row: BadgeRow, index: number) =>
  `${row.map(badge => `${badge.provider ?? 'twitch'}-${badge.id}`).join('|')}-${index}`;

function toEmotePart(emote: SanitisedEmote): ParsedPart<'emote'> {
  return { ...emote, type: 'emote', content: emote.name };
}

function EmotesTab({
  onSelectEmote,
}: {
  onSelectEmote: (emote: SanitisedEmote) => void;
}) {
  const { bottom: bottomInset } = useSafeAreaInsets();
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
        bttvGlobalEmotes: caches.bttvGlobalEmotes,
        ffzGlobalEmotes: caches.ffzGlobalEmotes,
        sevenTvGlobalEmotes: caches.sevenTvGlobalEmotes,
        twitchGlobalEmotes: caches.twitchGlobalEmotes,
      }),
    [
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
    () => flattenProviderSets(filteredSets, 5),
    [filteredSets],
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
          cellSize={56}
          items={item.items ?? []}
          onPress={handleEmotePress}
        />
      );
    },
    [filteredSets, handleEmotePress],
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
      <View style={styles.centered}>
        <Text weight='semibold'>No emotes found</Text>
      </View>
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

function BadgeCell({
  badge,
  onPress,
}: {
  badge: SanitisedBadgeSet;
  onPress: (badge: SanitisedBadgeSet) => void;
}) {
  return (
    <Button
      testID={`badge-cell-${badge.id}`}
      style={styles.badgeCell}
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
  onPress,
}: {
  row: BadgeRow;
  onPress: (badge: SanitisedBadgeSet) => void;
}) {
  return (
    <View style={styles.badgeRow}>
      {row.map(badge => (
        <BadgeCell
          key={`${badge.provider ?? 'twitch'}-${badge.id}`}
          badge={badge}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

function BadgeSectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.badgeSectionHeader}>
      <Text type='sm' weight='semibold' style={styles.badgeSectionTitle}>
        {title}
      </Text>
    </View>
  );
}

function BadgesTab({
  onSelectBadge,
}: {
  onSelectBadge: (badge: SanitisedBadgeSet) => void;
}) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { twitchGlobalBadges } = useGlobalEmoteBadgeCaches();
  const [ensureSettled, setEnsureSettled] = useState(false);

  useEffect(() => {
    ensureGlobalChatResources().finally(() => setEnsureSettled(true));
  }, []);

  const twitchLoading = !ensureSettled && twitchGlobalBadges.length === 0;

  const { data: sevenTvBadges, isLoading: sevenTvLoading } = useQuery(
    sevenTvBadgesQueryOptions(),
  );

  const badges = useMemo(
    () => [...twitchGlobalBadges, ...(sevenTvBadges ?? [])],
    [twitchGlobalBadges, sevenTvBadges],
  );

  const sections = useMemo(() => groupBadgesByProvider(badges, 5), [badges]);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<BadgeRow, BadgeProviderSection>) => (
      <BadgeRowView row={item} onPress={onSelectBadge} />
    ),
    [onSelectBadge],
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
      <View style={styles.centered}>
        <Text weight='semibold'>No badges available</Text>
      </View>
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
  const [tabIndex, setTabIndex] = useState(0);

  const [selectedEmote, setSelectedEmote] =
    useState<ParsedPart<'emote'> | null>(null);

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
        Platform.OS === 'ios' && { paddingTop: topInset + 44 },
      ]}
    >
      <View style={styles.segmentWrap}>
        <SegmentedControl
          items={[{ label: 'Emotes' }, { label: 'Badges' }]}
          currentIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      {tabIndex === 0 ? (
        <EmotesTab onSelectEmote={handleSelectEmote} />
      ) : (
        <BadgesTab onSelectBadge={setSelectedBadge} />
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
    borderRadius: theme.borderRadius12,
    height: BADGE_CELL_SIZE,
    justifyContent: 'center',
    margin: theme.space4,
    width: BADGE_CELL_SIZE,
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
    paddingHorizontal: theme.space12,
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
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
