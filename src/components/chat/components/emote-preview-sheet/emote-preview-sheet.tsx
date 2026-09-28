import { memo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/bottom-sheet/bottom-sheet';
/* eslint-disable react-native/sort-styles */
import { Button } from '@app/components/button/button';
import { ChatDebugSection } from '@app/components/chat/components/chat-debug-section';
import { computeSheetHeight } from '@app/components/chat/util/compute-sheet-height';
import { Image } from '@app/components/image/image';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { useSaveImageToGallery } from '@app/hooks/use-save-image-to-gallery';
import {
  getChatDebugEmoteDetails,
  getChatDebugEmoteSources,
} from '@app/store/chat/actions/chat-debug-log';
import { usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/open-link-in-browser';
import type { MessageToken } from '@app/utils/chat/message-token';
import { getDisplayEmoteUrl } from '@app/utils/emote/get-display-emote-url';

import { type PreviewAction, SheetActionGroup } from '../sheet-action-group';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedEmote: MessageToken<'emote'>;
}

/**
 * Largest size that fits a square box while keeping the aspect ratio.
 */
function fitToBox(box: number, aspectRatio: number) {
  return aspectRatio > 1
    ? { width: box, height: box / aspectRatio }
    : { width: box * aspectRatio, height: box };
}

const MIN_EMOTE_SIZE = 36;

function getEmoteName(emote: MessageToken<'emote'>): string {
  return emote.name ?? emote.original_name ?? emote.content;
}

function EmotePreviewSheetComponent(props: Props) {
  const { saveImage, isSaving } = useSaveImageToGallery();
  const { visible, onClose, selectedEmote } = props;
  const sheetRef = useRef<BottomSheetHandle>(null);

  const requestClose = () => {
    sheetRef.current?.requestClose();
  };

  const disableAnimations = usePreference('disableEmoteAnimations');
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const displayUrl = getDisplayEmoteUrl({
    url: selectedEmote.url,
    static_url: selectedEmote.static_url,
    disableAnimations,
  });

  const saveUrl = getDisplayEmoteUrl({
    image_variants: selectedEmote.image_variants,
    url: selectedEmote.url,
    static_url: selectedEmote.static_url,
    disableAnimations: true,
    preferredScale: '4x',
  });

  const emoteName = getEmoteName(selectedEmote);

  const emoteLink =
    String(selectedEmote.emote_link) === selectedEmote.emote_link
      ? selectedEmote.emote_link
      : undefined;

  const maxEmoteSize = Math.min(Math.max(screenWidth * 0.36, 96), 156);

  const emoteSize = (() => {
    const originalWidth = selectedEmote.width || 28;
    const originalHeight = selectedEmote.height || 28;
    const aspectRatio = originalWidth / originalHeight;
    const capped =
      originalWidth > maxEmoteSize || originalHeight > maxEmoteSize
        ? fitToBox(maxEmoteSize, aspectRatio)
        : { width: originalWidth, height: originalHeight };

    const scaled =
      capped.width < MIN_EMOTE_SIZE && capped.height < MIN_EMOTE_SIZE
        ? fitToBox(MIN_EMOTE_SIZE, aspectRatio)
        : capped;

    return {
      height: Math.round(scaled.height),
      width: Math.round(scaled.width),
    };
  })();

  const handleCopy = (field: 'name' | 'url') => {
    void Clipboard.setStringAsync(
      field === 'name' ? emoteName : displayUrl,
    ).then(() =>
      toast.success(
        field === 'name' ? 'Emote name copied' : 'Emote URL copied',
      ),
    );
  };

  const handleSaveImage = () => {
    saveImage(
      { url: saveUrl },
      {
        onError: () => toast.error('Could not save emote'),
        onSuccess: () => toast.success('Emote saved to gallery'),
      },
    );
  };

  const metadataRows = [
    { label: 'Provider', value: selectedEmote.site },
    { label: 'Creator', value: selectedEmote.creator },
    {
      label: 'Original',
      value:
        selectedEmote.original_name && selectedEmote.original_name !== emoteName
          ? selectedEmote.original_name
          : undefined,
    },
  ].filter(row => Boolean(row.value));

  const actions: PreviewAction[] = (() => {
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

    if (saveUrl) {
      items.push({
        icon: 'square.and.arrow.down',
        label: 'Save image',
        onPress: handleSaveImage,
        subtitle: 'Save to your photo gallery',
        disabled: isSaving,
      });
    }

    if (emoteLink) {
      items.push({
        icon: 'arrow.up.right.square',
        label: 'Open in Browser',
        onPress: () => openLinkInBrowser(emoteLink),
        subtitle: 'Source page',
      });
    }

    return items;
  })();

  const sheetHeight = computeSheetHeight(
    screenHeight,
    metadataRows.length,
    actions.length,
    152,
  );

  return (
    <BottomSheet
      ref={sheetRef}
      enableFixedSnapPoints
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      snapPoints={[{ height: sheetHeight }]}
      testID='emote-preview-sheet'
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow} weight='semibold'>
              Emote preview
            </Text>
            <Text style={styles.title} weight='semibold' numberOfLines={2}>
              {emoteName}
            </Text>
          </View>
          <Button label='Done' style={styles.doneButton} onPress={requestClose}>
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary.dark}
            />
          </Button>
        </View>

        <ScrollView
          nestedScrollEnabled
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewPanel}>
            <View style={styles.imageStage}>
              <Image
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

          <SheetActionGroup actions={actions} />

          <ChatDebugSection
            build={() => ({
              payload: {
                emote: selectedEmote,
                emoteDetails: getChatDebugEmoteDetails(selectedEmote),
                emoteSources: getChatDebugEmoteSources(),
              },
            })}
          />
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const EmotePreviewSheet = memo(EmotePreviewSheetComponent);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flex: 1,
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
    width: '100%',
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  emoteImage: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
  },
  eyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heading: {
    flex: 1,
    paddingRight: theme.space12,
  },
  imageStage: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    height: 152,
    justifyContent: 'center',
    width: '100%',
  },
  metadataCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
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
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.2,
  },
  previewPanel: {
    gap: theme.space12,
    paddingVertical: theme.space4,
  },
  previewPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46,134,255,0.16)',
    borderColor: 'rgba(46,134,255,0.34)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
    paddingVertical: 5,
  },
  previewPillText: {
    color: theme.colorPrimary,
    fontSize: theme.fontSize11,
  },
  scroll: {
    flex: 1,
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
