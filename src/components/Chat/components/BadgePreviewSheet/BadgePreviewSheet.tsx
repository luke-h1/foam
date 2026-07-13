import { memo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
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
import { theme } from '@app/styles/themes';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedBadge: SanitisedBadgeSet;
}

type PreviewAction = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  subtitle: string;
  disabled?: boolean;
};

function BadgePreviewSheetComponent(props: Props) {
  const { t } = useTranslation(['chat', 'common']);
  const { saveImage, isSaving } = useSaveImageToGallery();
  const { visible, onClose, selectedBadge } = props;
  const sheetRef = useRef<BottomSheetHandle>(null);
  const requestClose = () => {
    sheetRef.current?.requestClose();
  };
  const { height: screenHeight } = useWindowDimensions();

  const handleCopy = (field: 'name' | 'url') => {
    void Clipboard.setStringAsync(
      field === 'name' ? selectedBadge.title : selectedBadge.url,
    ).then(() =>
      toast.success(
        field === 'name'
          ? t('badgePreview.nameCopied')
          : t('badgePreview.urlCopied'),
      ),
    );
  };

  const handleSaveImage = () => {
    saveImage(
      { url: selectedBadge.url },
      {
        onError: () => toast.error(t('badgePreview.imageSaveFailed')),
        onSuccess: () => toast.success(t('badgePreview.imageSaved')),
      },
    );
  };

  const metadataRows = [
    { label: t('badgePreview.type'), value: selectedBadge.type },
    {
      label: t('badgePreview.provider'),
      value: selectedBadge.provider?.toUpperCase(),
    },
    { label: t('badgePreview.owner'), value: selectedBadge.owner_username },
    { label: t('badgePreview.set'), value: selectedBadge.set },
    { label: t('badgePreview.id'), value: selectedBadge.id },
  ].filter(row => Boolean(row.value));

  const actions: PreviewAction[] = (() => {
    const items: PreviewAction[] = [
      {
        icon: 'doc.on.doc',
        label: t('badgePreview.copyBadgeName'),
        onPress: () => handleCopy('name'),
        subtitle: selectedBadge.title,
      },
      {
        icon: 'link',
        label: t('badgePreview.copyBadgeUrl'),
        onPress: () => handleCopy('url'),
        subtitle: t('badgePreview.copyBadgeUrlSubtitle'),
      },
    ];

    if (selectedBadge.url) {
      items.push({
        icon: 'square.and.arrow.down',
        label: t('badgePreview.saveImage'),
        onPress: handleSaveImage,
        subtitle: t('badgePreview.saveImageSubtitle'),
        disabled: isSaving,
      });
      items.push({
        icon: 'arrow.up.right.square',
        label: t('badgePreview.openInBrowser'),
        onPress: () => openLinkInBrowser(selectedBadge.url),
        subtitle: t('badgePreview.openInBrowserSubtitle'),
      });
    }

    return items;
  })();

  const sheetHeight = computeSheetHeight(
    screenHeight,
    metadataRows.length,
    actions.length,
    128,
  );

  return (
    <BottomSheet
      ref={sheetRef}
      enableFixedSnapPoints
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      snapPoints={[{ height: sheetHeight }]}
      testID='badge-preview-sheet'
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow} weight='semibold'>
              {t('badgePreview.eyebrow')}
            </Text>
            <Text style={styles.title} weight='semibold' numberOfLines={2}>
              {selectedBadge.title}
            </Text>
          </View>
          <Button
            label={t('common:done')}
            style={styles.doneButton}
            onPress={requestClose}
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
                trackLoadContext='chat.badge-preview'
                source={selectedBadge.url}
                cacheVariant='badge'
                transition={50}
                style={styles.badgeImage}
                contentFit='contain'
              />
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText} weight='semibold'>
                {selectedBadge.type}
              </Text>
            </View>
          </View>

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

export const BadgePreviewSheet = memo(BadgePreviewSheetComponent);

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
  badgeImage: {
    height: 96,
    width: 96,
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 30,
    justifyContent: 'center',
    width: 30,
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
    height: 128,
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
