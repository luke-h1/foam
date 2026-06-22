import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LegendListRenderItemProps } from '@legendapp/list/react-native';
import { LegendList } from '@legendapp/list/react-native';

import { Button } from '@app/components/Button/Button';
import { BadgePreviewSheet } from '@app/components/Chat/components/BadgePreviewSheet/BadgePreviewSheet';
import { EmotePreviewSheet } from '@app/components/Chat/components/EmotePreviewSheet/EmotePreviewSheet';
import { EmoteRow } from '@app/components/Chat/components/EmoteSheet/EmoteRow';
import type { EmotePickerItem } from '@app/components/Chat/components/EmoteSheet/emoteSheetTypes';
import { ProviderChip } from '@app/components/Chat/components/EmoteSheet/ProviderChip';
import { SetHeader } from '@app/components/Chat/components/EmoteSheet/SetHeader';
import {
  buildEmoteMenuProviders,
  type EmoteMenuListItem,
  type EmoteMenuProviderId,
  filterProviderSets,
  flattenProviderSets,
} from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { Image } from '@app/components/Image/Image';
import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { Text } from '@app/components/ui/Text/Text';
import { useGlobalBadgesQuery } from '@app/hooks/queries/useGlobalBadgesQuery';
import { useGlobalEmotesQuery } from '@app/hooks/queries/useGlobalEmotesQuery';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

const BADGE_CELL_SIZE = 64;
const BADGE_IMAGE_SIZE = 40;

function toEmotePart(emote: SanitisedEmote): ParsedPart<'emote'> {
  return { ...emote, type: 'emote', content: emote.name };
}

function EmotesTab({
  onSelectEmote,
}: {
  onSelectEmote: (emote: SanitisedEmote) => void;
}) {
  const { t } = useTranslation(['settings', 'chat']);
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { data, isLoading } = useGlobalEmotesQuery();
  const [activeProviderId, setActiveProviderId] =
    useState<EmoteMenuProviderId | null>(null);

  const providers = useMemo(
    () =>
      data
        ? buildEmoteMenuProviders({
            bttvGlobalEmotes: data.bttvGlobalEmotes,
            ffzGlobalEmotes: data.ffzGlobalEmotes,
            sevenTvGlobalEmotes: data.sevenTvGlobalEmotes,
            twitchGlobalEmotes: data.twitchGlobalEmotes,
          })
        : [],
    [data],
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
      if (typeof item !== 'string') {
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
        <ActivityIndicator size='large' color={theme.color.text.dark} />
      </View>
    );
  }

  if (providers.length === 0) {
    return (
      <View style={styles.centered}>
        <Text weight='semibold'>{t('chat:emoteSheet.noEmotesFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps='handled'
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.providerBarContent}
        style={styles.providerBar}
      >
        {/* eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- bounded set of provider tabs */}
        {providers.map(provider => (
          <ProviderChip
            key={provider.id}
            isActive={provider.id === effectiveActiveProviderId}
            onPress={() => setActiveProviderId(provider.id)}
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
        showsVerticalScrollIndicator={false}
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

function BadgesTab({
  onSelectBadge,
}: {
  onSelectBadge: (badge: SanitisedBadgeSet) => void;
}) {
  const { t } = useTranslation('settings');
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { data, isLoading } = useGlobalBadgesQuery();

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<SanitisedBadgeSet>) => (
      <BadgeCell badge={item} onPress={onSelectBadge} />
    ),
    [onSelectBadge],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color={theme.color.text.dark} />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text weight='semibold'>{t('emoteBadgeViewerNoBadges')}</Text>
      </View>
    );
  }

  return (
    <LegendList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
      getItemType={() => 'badge'}
      numColumns={5}
      estimatedItemSize={BADGE_CELL_SIZE}
      recycleItems
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.badgeListContent,
        { paddingBottom: bottomInset + theme.space36 },
      ]}
      style={styles.flex}
    />
  );
}

export function EmoteBadgeViewerScreen() {
  const { t } = useTranslation('settings');
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
    <View style={styles.container}>
      <View style={styles.segmentWrap}>
        <SegmentedControl
          items={[
            { label: t('emoteBadgeViewerEmotes') },
            { label: t('emoteBadgeViewerBadges') },
          ]}
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
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
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
  providerBar: {
    flexGrow: 0,
    maxHeight: 54,
  },
  providerBarContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  segmentWrap: {
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
