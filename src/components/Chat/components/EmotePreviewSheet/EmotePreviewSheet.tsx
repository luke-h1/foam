/* eslint-disable react-native/sort-styles */
import { Button } from '@app/components/Button/Button';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import * as Clipboard from 'expo-clipboard';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useMemo, useCallback, memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { toast } from 'sonner-native';
import { CHAT_SHEET_BACKGROUND, chatSheetSurface } from '../chatSheetSurface';

interface Props {
  disableAnimations?: boolean;
  visible: boolean;
  onClose: () => void;
  selectedEmote: ParsedPart<'emote'>;
}

type MetadataRow = {
  label: string;
  value?: string | null;
};

type PreviewAction = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  subtitle: string;
};

const MIN_EMOTE_SIZE = 36;

function getEmoteName(emote: ParsedPart<'emote'>): string {
  return emote.name ?? emote.original_name ?? emote.content;
}

function EmotePreviewSheetComponent(props: Props) {
  const { visible, onClose, selectedEmote, disableAnimations = false } = props;
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(screenWidth - theme.space16 * 2, 520),
  );
  const displayUrl = useMemo(
    () =>
      getDisplayEmoteUrl({
        url: selectedEmote.url,
        static_url: selectedEmote.static_url,
        disableAnimations,
      }),
    [disableAnimations, selectedEmote.static_url, selectedEmote.url],
  );
  const emoteName = getEmoteName(selectedEmote);
  const emoteLink =
    typeof selectedEmote.emote_link === 'string'
      ? selectedEmote.emote_link
      : undefined;
  const maxEmoteSize = Math.min(Math.max(screenWidth * 0.36, 96), 156);
  const scrollStyle = useMemo(
    () => [styles.scroll, { maxHeight: Math.round(screenHeight * 0.58) }],
    [screenHeight],
  );
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        maxHeight: Math.round(screenHeight * 0.82),
        width: sheetWidth,
      },
    ],
    [screenHeight, sheetWidth],
  );

  const emoteSize = useMemo(() => {
    const originalWidth = selectedEmote.width || 28;
    const originalHeight = selectedEmote.height || 28;
    const aspectRatio = originalWidth / originalHeight;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (targetWidth > maxEmoteSize || targetHeight > maxEmoteSize) {
      if (aspectRatio > 1) {
        targetWidth = maxEmoteSize;
        targetHeight = maxEmoteSize / aspectRatio;
      } else {
        targetHeight = maxEmoteSize;
        targetWidth = maxEmoteSize * aspectRatio;
      }
    }

    if (targetWidth < MIN_EMOTE_SIZE && targetHeight < MIN_EMOTE_SIZE) {
      if (aspectRatio > 1) {
        targetWidth = MIN_EMOTE_SIZE;
        targetHeight = MIN_EMOTE_SIZE / aspectRatio;
      } else {
        targetHeight = MIN_EMOTE_SIZE;
        targetWidth = MIN_EMOTE_SIZE * aspectRatio;
      }
    }

    return {
      height: Math.round(targetHeight),
      width: Math.round(targetWidth),
    };
  }, [maxEmoteSize, selectedEmote.height, selectedEmote.width]);

  const handleCopy = useCallback(
    (field: 'name' | 'url') => {
      void Clipboard.setStringAsync(
        field === 'name' ? emoteName : displayUrl,
      ).then(() =>
        toast.success(
          field === 'name' ? 'Emote name copied' : 'Emote URL copied',
        ),
      );
    },
    [displayUrl, emoteName],
  );

  const metadataRows = useMemo<MetadataRow[]>(
    () =>
      [
        { label: 'Provider', value: selectedEmote.site },
        { label: 'Creator', value: selectedEmote.creator },
        {
          label: 'Original',
          value:
            selectedEmote.original_name &&
            selectedEmote.original_name !== emoteName
              ? selectedEmote.original_name
              : undefined,
        },
      ].filter(row => Boolean(row.value)),
    [
      emoteName,
      selectedEmote.creator,
      selectedEmote.original_name,
      selectedEmote.site,
    ],
  );

  const actions = useMemo<PreviewAction[]>(() => {
    const items: PreviewAction[] = [
      {
        icon: 'doc.on.doc',
        label: 'Copy emote name',
        onPress: () => handleCopy('name'),
        subtitle: emoteName,
      },
      {
        icon: 'link',
        label: 'Copy emote URL',
        onPress: () => handleCopy('url'),
        subtitle: 'Rendered image source',
      },
    ];

    if (emoteLink) {
      items.push({
        icon: 'arrow.up.right.square',
        label: 'Open in Browser',
        onPress: () => openLinkInBrowser(emoteLink),
        subtitle: 'Source page',
      });
    }

    return items;
  }, [emoteLink, emoteName, handleCopy]);

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      testID='emote-preview-sheet'
    >
      <View style={containerStyle}>
        <View style={styles.topBar}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow} weight='semibold'>
              Emote preview
            </Text>
            <Text style={styles.title} weight='semibold' numberOfLines={2}>
              {emoteName}
            </Text>
          </View>
          <Button label='Done' style={styles.doneButton} onPress={onClose}>
            <SymbolView
              name='checkmark'
              size={18}
              tintColor={theme.color.text.dark}
            />
          </Button>
        </View>

        <ScrollView
          style={scrollStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewPanel}>
            <View style={styles.imageStage}>
              <Image
                useNitro
                trackLoadTime
                trackLoadContext='chat.emote-preview'
                source={displayUrl}
                cacheVariant='emote'
                contentFit='contain'
                transition={100}
                style={[styles.emoteImage, emoteSize]}
              />
            </View>
            {selectedEmote.site ? (
              <View style={styles.previewPill}>
                <Text style={styles.previewPillText} weight='semibold'>
                  {selectedEmote.site}
                </Text>
              </View>
            ) : null}
          </View>

          {metadataRows.length > 0 ? (
            <View style={styles.metadataCard}>
              {metadataRows.map(row => (
                <View key={row.label} style={styles.metadataRow}>
                  <Text style={styles.metadataLabel} weight='semibold'>
                    {row.label}
                  </Text>
                  <Text style={styles.metadataValue} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actionGroup}>
            {actions.map((action, index) => (
              <Button
                key={action.label}
                onPress={action.onPress}
                style={[
                  styles.actionButton,
                  index < actions.length - 1 && styles.actionButtonBorder,
                ]}
              >
                <View style={styles.actionIconFrame}>
                  <SymbolView
                    name={action.icon}
                    tintColor={theme.colorGreen}
                    size={18}
                  />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionText} weight='semibold'>
                    {action.label}
                  </Text>
                  <Text style={styles.actionSubtitle} numberOfLines={1}>
                    {action.subtitle}
                  </Text>
                </View>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const EmotePreviewSheet = memo(EmotePreviewSheetComponent);

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 52,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomColor: 'rgba(255,255,255,0.075)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionGroup: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.18)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  actionSubtitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    lineHeight: theme.fontSize11 * 1.25,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.25,
  },
  container: {
    ...chatSheetSurface,
    backgroundColor: CHAT_SHEET_BACKGROUND,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    paddingBottom: theme.space16,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  emoteImage: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
  },
  eyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heading: {
    flex: 1,
    paddingRight: theme.space12,
  },
  imageStage: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: 152,
    justifyContent: 'center',
    width: '100%',
  },
  metadataCard: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    padding: theme.space12,
  },
  metadataLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    minWidth: 68,
    textTransform: 'uppercase',
  },
  metadataRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    paddingVertical: theme.space8,
  },
  metadataValue: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 13,
    lineHeight: theme.fontSize14 * 1.2,
  },
  previewPanel: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    gap: theme.space12,
    padding: theme.space12,
  },
  previewPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colorAccentSurface,
    borderColor: 'rgba(74, 222, 128, 0.22)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
    paddingVertical: 5,
  },
  previewPillText: {
    color: theme.colorGreen,
    fontSize: theme.fontSize11,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: theme.space12,
    paddingBottom: theme.space16,
  },
  title: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize18,
    lineHeight: theme.fontSize18 * 1.2,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'space-between',
    paddingBottom: theme.space12,
  },
});
