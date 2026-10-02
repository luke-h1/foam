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
  getChatDebugBadgeDetails,
  getChatDebugBadgeSources,
} from '@app/store/chat/actions/chat-debug-log';
import { theme } from '@app/styles/themes';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { openLinkInBrowser } from '@app/utils/browser/open-link-in-browser';

import { SheetHeader } from '../sheet/sheet-header';
import {
  type SheetAction,
  SheetActionGroup,
  SheetDetailGroup,
} from '../sheet-action-group';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedBadge: SanitisedBadgeSet;
}

function BadgePreviewSheetComponent(props: Props) {
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
        field === 'name' ? 'Badge name copied' : 'Badge URL copied',
      ),
    );
  };

  const handleSaveImage = () => {
    saveImage(
      { url: selectedBadge.url },
      {
        onError: () => toast.error('Could not save badge'),
        onSuccess: () => toast.success('Badge saved to gallery'),
      },
    );
  };

  const metadataRows = [
    { label: 'Type', value: selectedBadge.type },
    {
      label: 'Provider',
      value: selectedBadge.provider?.toUpperCase(),
    },
    { label: 'Owner', value: selectedBadge.owner_username },
    { label: 'Set', value: selectedBadge.set },
    { label: 'ID', value: selectedBadge.id },
  ].filter(row => Boolean(row.value));

  const actions: SheetAction[] = (() => {
    const items: SheetAction[] = [
      {
        icon: 'doc.on.doc',
        label: 'Copy badge name',
        onPress: () => handleCopy('name'),
      },
      {
        icon: 'link',
        label: 'Copy badge URL',
        onPress: () => handleCopy('url'),
      },
    ];

    if (selectedBadge.url) {
      items.push({
        icon: 'square.and.arrow.down',
        label: 'Save image',
        onPress: handleSaveImage,
        disabled: isSaving,
      });

      items.push({
        icon: 'arrow.up.right.square',
        label: 'Open in browser',
        onPress: () => openLinkInBrowser(selectedBadge.url),
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
        <SheetHeader title={selectedBadge.title} onClose={requestClose} />

        <ScrollView
          nestedScrollEnabled
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
            <Text type='footnote' color='gray.textLow' align='center'>
              {selectedBadge.type}
            </Text>
          </View>

          <SheetDetailGroup details={metadataRows} />

          <SheetActionGroup actions={actions} />

          <ChatDebugSection
            build={() => ({
              payload: {
                badge: selectedBadge,
                badgeDetails: getChatDebugBadgeDetails(selectedBadge),
                badgeSources: getChatDebugBadgeSources(),
              },
            })}
          />
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const BadgePreviewSheet = memo(BadgePreviewSheetComponent);

const styles = StyleSheet.create({
  badgeImage: {
    height: 96,
    width: 96,
  },
  container: {
    alignSelf: 'stretch',
    flex: 1,
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
    width: '100%',
  },
  imageStage: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    height: 128,
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
