import { memo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import { computeSheetHeight } from '@app/components/Chat/util/computeSheetHeight';
import { Image } from '@app/components/Image/Image';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useSaveImageToGallery } from '@app/hooks/useSaveImageToGallery';
import { usePreference } from '@app/store/preferences/selectors';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

import { computeEmotePreviewSize } from './computeEmotePreviewSize';
import { EmotePreviewActions, type PreviewAction } from './EmotePreviewActions';
import { EmotePreviewMetadata } from './EmotePreviewMetadata';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedEmote: ParsedPart<'emote'>;
}

function getEmoteName(emote: ParsedPart<'emote'>): string {
  return emote.name ?? emote.original_name ?? emote.content;
}

function EmotePreviewSheetComponent(props: Props) {
  const { t } = useTranslation(['chat', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
    typeof selectedEmote.emote_link === 'string'
      ? selectedEmote.emote_link
      : undefined;
  const maxEmoteSize = Math.min(Math.max(screenWidth * 0.36, 96), 156);
  const emoteSize = computeEmotePreviewSize(
    selectedEmote.width || 28,
    selectedEmote.height || 28,
    maxEmoteSize,
  );

  const handleCopy = (field: 'name' | 'url') => {
    void Clipboard.setStringAsync(
      field === 'name' ? emoteName : displayUrl,
    ).then(() =>
      toast.success(
        field === 'name'
          ? t('emotePreview.nameCopied')
          : t('emotePreview.urlCopied'),
      ),
    );
  };

  const handleSaveImage = () => {
    saveImage(
      { url: saveUrl },
      {
        onError: () => toast.error(t('emotePreview.imageSaveFailed')),
        onSuccess: () => toast.success(t('emotePreview.imageSaved')),
      },
    );
  };

  const metadataRows = [
    { label: t('emotePreview.provider'), value: selectedEmote.site },
    { label: t('emotePreview.creator'), value: selectedEmote.creator },
    {
      label: t('emotePreview.original'),
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
        label: t('emotePreview.copyEmoteName'),
        onPress: () => handleCopy('name'),
        subtitle: emoteName,
      },
      {
        icon: 'link',
        label: t('emotePreview.copyEmoteUrl'),
        onPress: () => handleCopy('url'),
        subtitle: t('emotePreview.copyEmoteUrlSubtitle'),
      },
    ];

    if (saveUrl) {
      items.push({
        icon: 'square.and.arrow.down',
        label: t('emotePreview.saveImage'),
        onPress: handleSaveImage,
        subtitle: t('emotePreview.saveImageSubtitle'),
        disabled: isSaving,
      });
    }

    if (emoteLink) {
      items.push({
        icon: 'arrow.up.right.square',
        label: t('emotePreview.openInBrowser'),
        onPress: () => openLinkInBrowser(emoteLink, scheme),
        subtitle: t('emotePreview.openInBrowserSubtitle'),
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
            <Text
              style={[
                styles.eyebrow,
                { color: theme.color.textSecondary[scheme] },
              ]}
              weight='semibold'
            >
              {t('emotePreview.eyebrow')}
            </Text>
            <Text
              style={[styles.title, { color: theme.color.text[scheme] }]}
              weight='semibold'
              numberOfLines={2}
            >
              {emoteName}
            </Text>
          </View>
          <Button
            label={t('common:done')}
            style={[
              styles.doneButton,
              {
                backgroundColor:
                  scheme === 'dark'
                    ? 'rgba(255,255,255,0.14)'
                    : 'rgba(0,0,0,0.08)',
              },
            ]}
            onPress={requestClose}
          >
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary[scheme]}
            />
          </Button>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewPanel}>
            <View
              style={[
                styles.imageStage,
                { backgroundColor: theme.color.surfaceAlpha[scheme] },
              ]}
            >
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
              <View
                style={[
                  styles.previewPill,
                  {
                    backgroundColor: theme.color.accentSurface[scheme],
                    borderColor:
                      scheme === 'dark'
                        ? 'rgba(46,134,255,0.34)'
                        : theme.color.accentRing.light,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.previewPillText,
                    { color: theme.color.accent[scheme] },
                  ]}
                  weight='semibold'
                >
                  {selectedEmote.site}
                </Text>
              </View>
            ) : null}
          </View>

          <EmotePreviewMetadata rows={metadataRows} />
          <EmotePreviewActions actions={actions} />
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    height: 152,
    justifyContent: 'center',
    width: '100%',
  },
  previewPanel: {
    gap: theme.space12,
    paddingVertical: theme.space4,
  },
  previewPill: {
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
    paddingVertical: 5,
  },
  previewPillText: {
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
