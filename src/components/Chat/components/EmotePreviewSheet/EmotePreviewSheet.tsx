import { memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
/* eslint-disable react-native/sort-styles */
import { Button } from '@app/components/Button/Button';
import { computeSheetHeight } from '@app/components/Chat/util/computeSheetHeight';
import { Image } from '@app/components/Image/Image';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useSaveImageToGallery } from '@app/hooks/useSaveImageToGallery';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

interface Props {
  disableAnimations?: boolean;
  visible: boolean;
  onClose: () => void;
  selectedEmote: ParsedPart<'emote'>;
}

type PreviewAction = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  subtitle: string;
  disabled?: boolean;
};

const MIN_EMOTE_SIZE = 36;

function getEmoteName(emote: ParsedPart<'emote'>): string {
  return emote.name ?? emote.original_name ?? emote.content;
}

function EmotePreviewSheetComponent(props: Props) {
  const { t } = useTranslation(['chat', 'common']);
  const { saveImage, isSaving } = useSaveImageToGallery();
  const { visible, onClose, selectedEmote, disableAnimations = false } = props;
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(screenWidth - theme.space16 * 2, 520),
  );
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
  const containerStyle = [styles.container, { width: sheetWidth }];

  const emoteSize = (() => {
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
  })();

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
        onPress: () => openLinkInBrowser(emoteLink),
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
      enableFixedSnapPoints
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      snapPoints={[{ height: sheetHeight }]}
      testID='emote-preview-sheet'
    >
      <View style={containerStyle}>
        <View style={styles.topBar}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow} weight='semibold'>
              {t('emotePreview.eyebrow')}
            </Text>
            <Text style={styles.title} weight='semibold' numberOfLines={2}>
              {emoteName}
            </Text>
          </View>
          <Button
            label={t('common:done')}
            style={styles.doneButton}
            onPress={onClose}
          >
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary.dark}
            />
          </Button>
        </View>

        <ScrollView
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

          <View style={styles.actionGroup}>
            {actions.map((action, index) => (
              <Button
                key={action.label}
                onPress={action.onPress}
                disabled={action.disabled}
                style={[
                  styles.actionButton,
                  index < actions.length - 1 && styles.actionButtonBorder,
                ]}
              >
                <View style={styles.actionIconFrame}>
                  <SymbolView
                    name={action.icon}
                    tintColor={theme.colorPrimary}
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
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 56,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
    gap: 1,
  },
  actionGroup: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(46,134,255,0.16)',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionSubtitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
  container: {
    alignSelf: 'center',
    flex: 1,
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
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
