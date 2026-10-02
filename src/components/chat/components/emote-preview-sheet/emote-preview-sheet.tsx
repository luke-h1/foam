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
import { ChatDebugSection } from '@app/components/chat/components/chat-debug-section';
import { computeSheetHeight } from '@app/components/chat/util/compute-sheet-height';
import { Image } from '@app/components/image/image';
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

import { SheetHeader } from '../sheet/sheet-header';
import {
  type SheetAction,
  SheetActionGroup,
  SheetDetailGroup,
} from '../sheet-action-group';

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

  const actions: SheetAction[] = (() => {
    const items: SheetAction[] = [
      {
        icon: 'doc.on.doc',
        label: 'Copy emote name',
        onPress: () => handleCopy('name'),
      },
      {
        icon: 'link',
        label: 'Copy emote URL',
        onPress: () => handleCopy('url'),
      },
    ];

    if (saveUrl) {
      items.push({
        icon: 'square.and.arrow.down',
        label: 'Save image',
        onPress: handleSaveImage,
        disabled: isSaving,
      });
    }

    if (emoteLink) {
      items.push({
        icon: 'arrow.up.right.square',
        label: 'Open in browser',
        onPress: () => openLinkInBrowser(emoteLink),
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
        <SheetHeader title={emoteName} onClose={requestClose} />

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
              <Text type='footnote' color='gray.textLow' align='center'>
                {selectedEmote.site}
              </Text>
            ) : null}
          </View>

          {metadataRows.length > 0 ? (
            <SheetDetailGroup details={metadataRows} />
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
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
    width: '100%',
  },
  emoteImage: {
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
  },
  imageStage: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    height: 152,
    justifyContent: 'center',
    width: '100%',
  },
  previewPanel: {
    gap: theme.space12,
    marginBottom: theme.space24,
    paddingVertical: theme.space4,
  },
  scroll: {
    flex: 1,
  },
  /**
   * No gap: each `SettingsSection` carries its own bottom margin, and the
   * preview panel matches it.
   */
  scrollContent: {
    paddingBottom: theme.space16,
  },
});
