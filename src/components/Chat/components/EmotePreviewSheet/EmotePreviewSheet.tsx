import { memo, useMemo, useRef } from 'react';
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
/* eslint-disable react-native/sort-styles */
import { Button } from '@app/components/Button/Button';
import { computeSheetHeight } from '@app/components/Chat/util/computeSheetHeight';
import { Image } from '@app/components/Image/Image';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useSaveImageToGallery } from '@app/hooks/useSaveImageToGallery';
import { usePreference } from '@app/store/preferences/selectors';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

interface Props {
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const colorStyles = useMemo(
    () => ({
      actionButtonBorder: { borderBottomColor: theme.color.border[scheme] },
      actionGroup: { backgroundColor: theme.color.surfaceAlpha[scheme] },
      accentIconFrame: {
        backgroundColor: theme.color.accentSurface[scheme],
      },
      accentText: { color: theme.color.accent[scheme] },
      doneButton: {
        backgroundColor:
          scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
      },
      previewPill: {
        backgroundColor: theme.color.accentSurface[scheme],
        borderColor:
          scheme === 'dark'
            ? 'rgba(46,134,255,0.34)'
            : theme.color.accentRing.light,
      },
      primaryText: { color: theme.color.text[scheme] },
      secondaryText: { color: theme.color.textSecondary[scheme] },
      surface: { backgroundColor: theme.color.surfaceAlpha[scheme] },
    }),
    [scheme],
  );
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
              style={[styles.eyebrow, colorStyles.secondaryText]}
              weight='semibold'
            >
              {t('emotePreview.eyebrow')}
            </Text>
            <Text
              style={[styles.title, colorStyles.primaryText]}
              weight='semibold'
              numberOfLines={2}
            >
              {emoteName}
            </Text>
          </View>
          <Button
            label={t('common:done')}
            style={[styles.doneButton, colorStyles.doneButton]}
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
            <View style={[styles.imageStage, colorStyles.surface]}>
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
              <View style={[styles.previewPill, colorStyles.previewPill]}>
                <Text
                  style={[styles.previewPillText, colorStyles.accentText]}
                  weight='semibold'
                >
                  {selectedEmote.site}
                </Text>
              </View>
            ) : null}
          </View>

          {metadataRows.length > 0 ? (
            <View style={[styles.metadataCard, colorStyles.surface]}>
              {metadataRows.map(row => (
                <View key={row.label} style={styles.metadataRow}>
                  <Text
                    style={[styles.metadataLabel, colorStyles.secondaryText]}
                    weight='semibold'
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={[styles.metadataValue, colorStyles.primaryText]}
                    numberOfLines={2}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={[styles.actionGroup, colorStyles.actionGroup]}>
            {actions.map((action, index) => (
              <Button
                key={action.label}
                onPress={action.onPress}
                disabled={action.disabled}
                style={[
                  styles.actionButton,
                  index < actions.length - 1 && [
                    styles.actionButtonBorder,
                    colorStyles.actionButtonBorder,
                  ],
                ]}
              >
                <View
                  style={[styles.actionIconFrame, colorStyles.accentIconFrame]}
                >
                  <SymbolView
                    name={action.icon}
                    tintColor={theme.color.accent[scheme]}
                    size={18}
                  />
                </View>
                <View style={styles.actionCopy}>
                  <Text
                    style={[styles.actionText, colorStyles.primaryText]}
                    weight='semibold'
                  >
                    {action.label}
                  </Text>
                  <Text
                    style={[styles.actionSubtitle, colorStyles.secondaryText]}
                    numberOfLines={1}
                  >
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
    gap: 1,
  },
  actionGroup: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
  actionIconFrame: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionSubtitle: {
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
  },
  actionText: {
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
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
  metadataCard: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    padding: theme.space12,
  },
  metadataLabel: {
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
