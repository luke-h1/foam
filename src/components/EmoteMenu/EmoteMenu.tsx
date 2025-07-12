import { Button, Typography, Image } from '@app/components';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useState, memo } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { SanitisiedEmoteSet } from '../../services/seventTvService';
import { useEmotesSelector } from '../../store/chatStore';

const EMOTES_PER_ROW = 5;

interface EmoteMenuProps {
  onEmotePress: (emote: SanitisiedEmoteSet) => void;
  recentEmotes?: SanitisiedEmoteSet[];
}

type TabKey = 'recent' | '7tv' | 'bttv' | 'ffz' | 'twitch';
type SubMenuKey = 'all' | 'channel' | 'global' | 'subscriber';

interface Tab {
  key: TabKey;
  label: string;
  icon?: string;
}

interface SubTab {
  key: SubMenuKey;
  label: string;
  icon?: string;
}

const tabs: Tab[] = [
  { key: 'recent', label: 'Recent', icon: '🕐' },
  { key: '7tv', label: '7TV', icon: '7️⃣' },
  { key: 'bttv', label: 'BTTV', icon: '🅱️' },
  { key: 'ffz', label: 'FFZ', icon: '🐸' },
  { key: 'twitch', label: 'Twitch', icon: '💜' },
];

const subTabs: SubTab[] = [
  { key: 'all', label: 'All', icon: '🔢' },
  { key: 'channel', label: 'Channel', icon: '📺' },
  { key: 'global', label: 'Global', icon: '🌍' },
  { key: 'subscriber', label: 'Sub', icon: '👑' },
];

const filterEmotesByType = (
  emotes: SanitisiedEmoteSet[],
  subMenuKey: SubMenuKey,
): SanitisiedEmoteSet[] => {
  if (subMenuKey === 'all') return emotes;

  const predicates = {
    channel: (emote: SanitisiedEmoteSet) =>
      emote.site.includes('Channel') || emote.site === 'BTTV',
    global: (emote: SanitisiedEmoteSet) => emote.site.includes('Global'),
    subscriber: (emote: SanitisiedEmoteSet) =>
      emote.bits !== undefined ||
      emote.site.includes('subscription') ||
      emote.site.includes('sub'),
  };

  const predicate = predicates[subMenuKey];
  return predicate ? emotes.filter(predicate) : emotes;
};

const memoizedFilterEmotesByType = ((
  cache: Map<string, SanitisiedEmoteSet[]> = new Map(),
) => {
  return (
    emotes: SanitisiedEmoteSet[],
    subMenuKey: SubMenuKey,
  ): SanitisiedEmoteSet[] => {
    if (subMenuKey === 'all') return emotes;

    const cacheKey = `${emotes.length}-${subMenuKey}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = filterEmotesByType(emotes, subMenuKey);
    cache.set(cacheKey, result);

    // Clear cache when it gets too large
    if (cache.size > 50) {
      cache.clear();
    }

    return result;
  };
})();

interface EmoteItemProps {
  item: SanitisiedEmoteSet;
  onPress: () => void;
  styles: {
    emoteContainer: Record<string, unknown>;
    emoteImage: Record<string, unknown>;
    emoteName: Record<string, unknown>;
  };
}

const EmoteItem: React.FC<EmoteItemProps> = memo(
  ({ item, onPress, styles }) => {
    return (
      <Button style={styles.emoteContainer} onPress={onPress}>
        <Image
          source={item.url}
          style={styles.emoteImage}
          contentFit="contain"
        />
        <Typography style={styles.emoteName} numberOfLines={1}>
          {item.name}
        </Typography>
      </Button>
    );
  },
);

export const EmoteMenu: React.FC<EmoteMenuProps> = memo(
  ({ onEmotePress, recentEmotes = [] }) => {
    const { styles } = useStyles(stylesheet);
    const [activeTab, setActiveTab] = useState<TabKey>('recent');
    const [activeSubMenu, setActiveSubMenu] = useState<SubMenuKey>('all');

    const {
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
    } = useEmotesSelector();

    // Optimize data processing with better memoization and efficient concatenation
    const sevenTvEmotes = useMemo(() => {
      if (sevenTvChannelEmotes.length === 0) return sevenTvGlobalEmotes;
      if (sevenTvGlobalEmotes.length === 0) return sevenTvChannelEmotes;
      return sevenTvChannelEmotes.concat(sevenTvGlobalEmotes);
    }, [sevenTvChannelEmotes, sevenTvGlobalEmotes]);

    const bttvEmotes = useMemo(() => {
      if (bttvChannelEmotes.length === 0) return bttvGlobalEmotes;
      if (bttvGlobalEmotes.length === 0) return bttvChannelEmotes;
      return bttvChannelEmotes.concat(bttvGlobalEmotes);
    }, [bttvChannelEmotes, bttvGlobalEmotes]);

    const ffzEmotes = useMemo(() => {
      if (ffzChannelEmotes.length === 0) return ffzGlobalEmotes;
      if (ffzGlobalEmotes.length === 0) return ffzChannelEmotes;
      return ffzChannelEmotes.concat(ffzGlobalEmotes);
    }, [ffzChannelEmotes, ffzGlobalEmotes]);

    const twitchEmotes = useMemo(() => {
      if (twitchChannelEmotes.length === 0) return twitchGlobalEmotes;
      if (twitchGlobalEmotes.length === 0) return twitchChannelEmotes;
      return twitchChannelEmotes.concat(twitchGlobalEmotes);
    }, [twitchChannelEmotes, twitchGlobalEmotes]);

    const emotesByTab = useMemo(
      () => ({
        recent: recentEmotes,
        '7tv': sevenTvEmotes,
        bttv: bttvEmotes,
        ffz: ffzEmotes,
        twitch: twitchEmotes,
      }),
      [recentEmotes, sevenTvEmotes, bttvEmotes, ffzEmotes, twitchEmotes],
    );

    const currentEmotes = useMemo(() => {
      const tabEmotes = emotesByTab[activeTab];

      // Don't filter recent emotes by sub-menu
      if (activeTab === 'recent' || activeSubMenu === 'all') {
        return tabEmotes;
      }

      return memoizedFilterEmotesByType(tabEmotes, activeSubMenu);
    }, [emotesByTab, activeTab, activeSubMenu]);

    const renderEmote = useCallback(
      // eslint-disable-next-line react/no-unused-prop-types
      ({ item }: { item: SanitisiedEmoteSet; index: number }) => (
        <EmoteItem
          item={item}
          onPress={() => onEmotePress(item)}
          styles={{
            emoteContainer: styles.emoteContainer,
            emoteImage: styles.emoteImage,
            emoteName: styles.emoteName,
          }}
        />
      ),
      [onEmotePress, styles],
    );

    const keyExtractor = useCallback((item: SanitisiedEmoteSet) => item.id, []);

    return (
      <View style={styles.container}>
        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <Button
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab.key);
                setActiveSubMenu('all'); // Reset sub-menu when switching tabs
              }}
            >
              <Typography style={styles.tabIcon}>{tab.icon}</Typography>
              <Typography
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Typography>
            </Button>
          ))}
        </View>

        {activeTab !== 'recent' && (
          <View style={styles.subTabBar}>
            {subTabs.map(subTab => (
              <Button
                key={subTab.key}
                style={[
                  styles.subTab,
                  activeSubMenu === subTab.key && styles.activeSubTab,
                ]}
                onPress={() => setActiveSubMenu(subTab.key)}
              >
                <Typography style={styles.subTabIcon}>{subTab.icon}</Typography>
                <Typography
                  style={[
                    styles.subTabLabel,
                    activeSubMenu === subTab.key && styles.activeSubTabLabel,
                  ]}
                >
                  {subTab.label}
                </Typography>
              </Button>
            ))}
          </View>
        )}

        <View style={styles.emoteGrid}>
          {currentEmotes.length > 0 ? (
            <BottomSheetFlatList
              data={currentEmotes}
              renderItem={renderEmote}
              keyExtractor={keyExtractor}
              numColumns={EMOTES_PER_ROW}
              contentContainerStyle={styles.flashListContainer}
              showsVerticalScrollIndicator={false}
              initialNumToRender={25}
              maxToRenderPerBatch={15}
              windowSize={10}
              removeClippedSubviews
              updateCellsBatchingPeriod={50}
              getItemLayout={(_data, index) => ({
                length: 80,
                offset: 80 * Math.floor(index / EMOTES_PER_ROW),
                index,
              })}
            />
          ) : (
            <View style={styles.emptyState}>
              <Typography style={styles.emptyStateText}>
                {activeTab === 'recent'
                  ? 'No recent emotes yet'
                  : `No ${tabs.find(t => t.key === activeTab)?.label} emotes available`}
              </Typography>
            </View>
          )}
        </View>
      </View>
    );
  },
);

EmoteItem.displayName = 'EmoteItem';
EmoteMenu.displayName = 'EmoteMenu';

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.border,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
    '@media': {
      sm: {
        fontSize: 18,
      },
      md: {
        fontSize: 20,
      },
      lg: {
        fontSize: 22,
      },
    },
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    '@media': {
      sm: {
        fontSize: 13,
      },
      md: {
        fontSize: 14,
      },
      lg: {
        fontSize: 15,
      },
    },
  },
  activeTabLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSubTab: {
    borderBottomColor: theme.colors.border,
  },
  subTabIcon: {
    fontSize: 12,
    marginBottom: 2,
    '@media': {
      sm: {
        fontSize: 14,
      },
      md: {
        fontSize: 16,
      },
      lg: {
        fontSize: 18,
      },
    },
  },
  subTabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text,
    '@media': {
      sm: {
        fontSize: 11,
      },
      md: {
        fontSize: 12,
      },
      lg: {
        fontSize: 13,
      },
    },
  },
  activeSubTabLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  emoteGrid: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  flashListContainer: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  emoteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    marginHorizontal: 2,
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    flex: 1,
    height: 72,
    '@media': {
      sm: {
        height: 76,
      },
      md: {
        height: 80,
      },
      lg: {
        height: 84,
      },
      xl: {
        height: 88,
      },
    },
  },
  emoteImage: {
    width: 48,
    height: 48,
    marginBottom: 4,
    '@media': {
      sm: {
        width: 52,
        height: 52,
      },
      md: {
        width: 56,
        height: 56,
      },
      lg: {
        width: 60,
        height: 60,
      },
      xl: {
        width: 64,
        height: 64,
      },
    },
  },
  emoteName: {
    fontSize: 10,
    color: theme.colors.text,
    textAlign: 'center',
    width: '100%',
    '@media': {
      sm: {
        fontSize: 11,
      },
      md: {
        fontSize: 12,
      },
      lg: {
        fontSize: 13,
      },
      xl: {
        fontSize: 14,
      },
    },
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
}));
