import { Button, Typography } from '@app/components';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef, useMemo, useState } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { useRecentEmotes } from '../../hooks/useRecentEmotes';
import { SanitisiedEmoteSet } from '../../services/seventTvService';
import { useEmotesSelector } from '../../store/chatStore';
import EmojiPicker, {
  EmojiSection,
  PickerItem,
  SubNavigationOption,
} from '../EmojiPicker/EmojiPicker';

interface EmoteMenuModalProps {
  onEmoteSelect: (emote: SanitisiedEmoteSet) => void;
  isVisible: boolean;
  onClose: () => void;
}

type SubMenuKey = 'all' | 'channel' | 'global' | 'subscriber';

const subNavigationOptions: SubNavigationOption[] = [
  { key: 'all', label: 'All' },
  { key: 'channel', label: 'Channel' },
  { key: 'global', label: 'Global' },
  { key: 'subscriber', label: 'Sub' },
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

export const EmoteMenuModal: React.FC<EmoteMenuModalProps> = ({
  onEmoteSelect,
  isVisible,
  onClose,
}) => {
  const { styles } = useStyles(stylesheet);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { recentEmotes, addRecentEmote } = useRecentEmotes();
  const [activeSubNavigation, setActiveSubNavigation] =
    useState<SubMenuKey>('all');

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

  // Combine and filter emotes by service
  const sevenTvEmotes = useMemo(() => {
    const combined = [...sevenTvChannelEmotes, ...sevenTvGlobalEmotes];
    return filterEmotesByType(combined, activeSubNavigation);
  }, [sevenTvChannelEmotes, sevenTvGlobalEmotes, activeSubNavigation]);

  const bttvEmotes = useMemo(() => {
    const combined = [...bttvChannelEmotes, ...bttvGlobalEmotes];
    return filterEmotesByType(combined, activeSubNavigation);
  }, [bttvChannelEmotes, bttvGlobalEmotes, activeSubNavigation]);

  const ffzEmotes = useMemo(() => {
    const combined = [...ffzChannelEmotes, ...ffzGlobalEmotes];
    return filterEmotesByType(combined, activeSubNavigation);
  }, [ffzChannelEmotes, ffzGlobalEmotes, activeSubNavigation]);

  const twitchEmotes = useMemo(() => {
    const combined = [...twitchChannelEmotes, ...twitchGlobalEmotes];
    return filterEmotesByType(combined, activeSubNavigation);
  }, [twitchChannelEmotes, twitchGlobalEmotes, activeSubNavigation]);

  // Create sections for the picker
  const emoteSections: EmojiSection[] = useMemo(() => {
    const sections: EmojiSection[] = [];

    // Recent emotes don't get filtered by sub-navigation
    if (recentEmotes.length > 0 && activeSubNavigation === 'all') {
      sections.push({
        title: 'Recent',
        icon: '🕐',
        data: recentEmotes,
      });
    }

    if (sevenTvEmotes.length > 0) {
      sections.push({
        title: '7TV',
        icon: '7️⃣',
        data: sevenTvEmotes,
      });
    }

    if (bttvEmotes.length > 0) {
      sections.push({
        title: 'BTTV',
        icon: '🅱️',
        data: bttvEmotes,
      });
    }

    if (ffzEmotes.length > 0) {
      sections.push({
        title: 'FFZ',
        icon: '🐸',
        data: ffzEmotes,
      });
    }

    if (twitchEmotes.length > 0) {
      sections.push({
        title: 'Twitch',
        icon: '💜',
        data: twitchEmotes,
      });
    }

    return sections;
  }, [
    recentEmotes,
    sevenTvEmotes,
    bttvEmotes,
    ffzEmotes,
    twitchEmotes,
    activeSubNavigation,
  ]);

  const handleEmotePress = useCallback(
    (item: PickerItem) => {
      if (typeof item === 'object') {
        const emote = item;
        addRecentEmote(emote);
        onEmoteSelect(emote);
        onClose();
      }
    },
    [addRecentEmote, onEmoteSelect, onClose],
  );

  const handleSubNavigationChange = useCallback((key: string) => {
    setActiveSubNavigation(key as SubMenuKey);
  }, []);

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [isVisible]);

  // Reset sub-navigation when modal closes
  React.useEffect(() => {
    if (!isVisible) {
      setActiveSubNavigation('all');
    }
  }, [isVisible]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={['50%', '75%']}
      onDismiss={onClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Typography style={styles.title}>Emotes</Typography>
          <Button onPress={onClose} style={styles.closeButton}>
            <Typography style={styles.closeButtonText}>✕</Typography>
          </Button>
        </View>

        <View style={styles.pickerContainer}>
          <EmojiPicker
            data={emoteSections}
            onItemPress={handleEmotePress}
            showSubNavigation
            subNavigationOptions={subNavigationOptions}
            activeSubNavigation={activeSubNavigation}
            onSubNavigationChange={handleSubNavigationChange}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const stylesheet = createStyleSheet(theme => ({
  bottomSheetBackground: {
    backgroundColor: theme.colors.border,
  },
  handleIndicator: {
    backgroundColor: theme.colors.border,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
}));
