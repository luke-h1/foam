/* eslint-disable no-restricted-syntax */

import { Typography } from '@app/components/Typography';
import { useChatContext } from '@app/context';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { LegendListRef } from '@legendapp/list';
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { View, ViewStyle, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { SanitisiedEmoteSet } from '../../../../services/seventv-service';
import { EmojiLegendList } from './EmojiLegendList';
import { SubNavigationBar } from './SubNavigationBar';
import {
  CHUNK_SIZE,
  EMOJI,
  EmojiSection,
  PICKER_PAD,
  PICKER_RADIUS,
  PICKER_WIDTH,
  processEmojiSections,
} from './config';

export const TOP_CORNER_STYLE: ViewStyle = {
  borderTopLeftRadius: PICKER_RADIUS,
  borderTopRightRadius: PICKER_RADIUS,
};

export type PickerItem = string | SanitisiedEmoteSet;

export interface EmojiItem {
  emoji: PickerItem;
  index: number;
  item: PickerItem;
}

export type EmojiPickerProps = {
  onItemPress?: (item: PickerItem) => void;
  showSubNavigation?: boolean;
  onSubNavigationChange?: (subKey: string) => void;
  activeSubNavigation?: string;
  subNavigationOptions?: SubNavigationOption[];
};

export type SubNavigationOption = {
  key: string;
  label: string;
};

type HeaderItem = {
  type: 'header';
  title: string;
};

type RowItem = {
  type: 'row';
  data: { item: PickerItem; index: number }[];
};

export type FlatListItem = HeaderItem | RowItem;

export interface PickerCell {
  item: PickerItem;
  index: number;
}

export const EmojiPickerSheet = forwardRef<BottomSheetModal, EmojiPickerProps>(
  (props, ref) => {
    const {
      activeSubNavigation,
      onItemPress,
      onSubNavigationChange,
      showSubNavigation,
      subNavigationOptions = [],
    } = props;

    const { height: screenHeight } = useWindowDimensions();
    const { top: topSafeAreaInset } = useSafeAreaInsets();

    // Calculate max height as 70% of available screen height
    const maxDynamicContentSize = useMemo(() => {
      const availableHeight = screenHeight - topSafeAreaInset;
      return Math.floor(availableHeight * 0.7);
    }, [screenHeight, topSafeAreaInset]);

    const {
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
    } = useChatContext();

    const legendListRef = useRef<LegendListRef>(null);
    const scrollY = useSharedValue<number>(0);
    const [activeSection, setActiveSection] = useState(0);

    const data = useMemo(() => {
      const sections: EmojiSection[] = [
        /**
         * 7TV
         */
        {
          title: '7TV Channel',
          icon: 'stv',
          data: sevenTvChannelEmotes,
        },
        {
          title: '7TV Global',
          icon: 'stv',
          data: sevenTvGlobalEmotes,
        },
        /**
         * Twitch
         */
        {
          title: 'Twitch Channel',
          icon: 'twitch',
          data: twitchChannelEmotes,
        },
        {
          title: 'Twitch Global',
          icon: 'twitch',
          data: twitchGlobalEmotes,
        },
        /**
         * FFZ
         */
        {
          title: 'FFZ Channel',
          icon: 'ffz',
          data: ffzChannelEmotes,
        },
        {
          title: 'FFZ Global',
          icon: 'ffz',
          data: ffzGlobalEmotes,
        },
        /**
         * BTTV
         */
        {
          title: 'BTTV Channel',
          icon: 'bttv',
          data: bttvChannelEmotes,
        },
        {
          title: 'BTTV Global',
          icon: 'bttv',
          data: bttvGlobalEmotes,
        },
        /**
         * TODO: chatterino
         */

        /**
         * Regular emojis
         */
        ...EMOJI,
      ];

      return sections;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flatData: FlatListItem[] = useMemo(() => {
      const processed = processEmojiSections(data, CHUNK_SIZE);
      const result: FlatListItem[] = [];
      for (const section of processed) {
        if (section.data.length > 0) {
          result.push({ type: 'header', title: section.title });
          for (const row of section.data) {
            // @ts-expect-error - TODO: fix this
            result.push({ type: 'row', data: row });
          }
        }
      }
      return result;
    }, [data]);

    const handleSectionPress = useCallback((sectionIndex: number) => {
      setActiveSection(sectionIndex);
    }, []);

    if (data.length === 0) {
      return (
        <View style={[{ width: PICKER_WIDTH }]}>
          <Typography>No emotes available</Typography>
        </View>
      );
    }

    return (
      <BottomSheetModal
        ref={ref}
        style={styles.contentContainer}
        backgroundStyle={styles.bottomSheet}
        enablePanDownToClose
        enableDynamicSizing
        maxDynamicContentSize={maxDynamicContentSize}
      >
        <BottomSheetView style={styles.wrapper}>
          <View
            style={{
              // backgroundColor: theme.colors.borderNeutral,
              paddingHorizontal: PICKER_PAD,
              borderRadius: PICKER_RADIUS,
              borderCurve: 'continuous',
            }}
          >
            <View style={[{ width: PICKER_WIDTH }]}>
              {showSubNavigation && subNavigationOptions.length > 0 && (
                <SubNavigationBar
                  options={subNavigationOptions}
                  activeKey={activeSubNavigation as string}
                  onPress={onSubNavigationChange}
                />
              )}
              <EmojiLegendList
                data={data}
                flatData={flatData}
                scrollY={scrollY}
                legendListRef={legendListRef}
                onItemPress={onItemPress}
                activeSection={activeSection}
                onSectionPress={handleSectionPress}
                showSubNavigation={showSubNavigation}
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

EmojiPickerSheet.displayName = 'EmojiPickerSheet';

const styles = StyleSheet.create(theme => ({
  contentContainer: {
    paddingHorizontal: theme.spacing.xl,
    overflow: 'visible',
  },
  wrapper: {
    paddingVertical: theme.spacing.md,
  },
  bottomSheet: {
    // backgroundColor: theme.colors.borderNeutral,
  },
}));
