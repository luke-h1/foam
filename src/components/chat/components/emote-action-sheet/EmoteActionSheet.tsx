import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatSheet } from '@app/components/chat/components/sheet/ChatSheet';
import { chatSheetStyles } from '@app/components/chat/components/sheet/ChatSheet.styles';
import { useChatSheet } from '@app/components/chat/components/sheet/hooks/use-chat-sheet';
import { SheetHeader } from '@app/components/chat/components/sheet/SheetHeader';
import {
  type ChatSheetLayout,
  SHEET_CHROME,
} from '@app/components/chat/components/sheet/util/chatSheetLayout';
import {
  fitToBox,
  getAssetAspectRatio,
} from '@app/components/chat/components/sheet/util/fitToBox';
import { getEmoteName } from '@app/components/chat/components/sheet/util/getEmoteName';
import {
  getSheetEmoteImageVariants,
  getSheetEmoteUrl,
} from '@app/components/chat/components/sheet/util/getSheetEmoteUrl';
import { SheetActionGroup } from '@app/components/chat/components/SheetActionGroup';
import { Image } from '@app/components/image/Image';
import { Text } from '@app/components/ui/text/Text';
import { copyWithToast } from '@app/lib/clipboard';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { EmoteImageScale } from '@app/types/emote';

type ActionId =
  | 'copy-name'
  | 'copy-url'
  | 'copy-url-2x'
  | 'copy-url-4x'
  | 'preview';

const COPY_IMAGE_VARIANT_ACTIONS = [
  { id: 'copy-url-2x', scale: '2x' },
  { id: 'copy-url-4x', scale: '4x' },
] as const;

const PREVIEW_IMAGE_MAX_SIZE = 56;

function getEmoteActionSFSymbolName(actionId: ActionId) {
  switch (actionId) {
    case 'copy-name':
    case 'copy-url':
    case 'copy-url-2x':
    case 'copy-url-4x':
      return 'doc.on.doc' as const;
    case 'preview':
      return 'arrow.up.right.square' as const;
  }
}

interface EmoteActionSheetProps {
  disableAnimations?: boolean;
  onDismiss: () => void;
  onPress?: (token: MessageToken<'emote'>) => void;
  token: MessageToken<'emote'>;
}

function EmoteActionSheetComponent({
  disableAnimations = false,
  onDismiss,
  token,
  onPress,
}: EmoteActionSheetProps) {
  const { runAndClose, requestClose, sheetRef } = useChatSheet();
  const resolvedImageVariants = useMemo(
    () => getSheetEmoteImageVariants(token),
    [token],
  );

  const preferredVariantKind = disableAnimations ? 'static' : 'animated';

  const scaledImageUrls = useMemo(() => {
    const alternateVariantKind =
      preferredVariantKind === 'static' ? 'animated' : 'static';

    return COPY_IMAGE_VARIANT_ACTIONS.reduce<
      Partial<Record<EmoteImageScale, string>>
    >((result, action) => {
      const url =
        resolvedImageVariants?.[preferredVariantKind]?.[action.scale] ??
        resolvedImageVariants?.[alternateVariantKind]?.[action.scale];

      if (url) {
        result[action.scale] = url;
      }

      return result;
    }, {});
  }, [preferredVariantKind, resolvedImageVariants]);

  const displayUrl = getSheetEmoteUrl(token, disableAnimations);

  const previewImageSize = fitToBox(
    PREVIEW_IMAGE_MAX_SIZE,
    getAssetAspectRatio(token),
  );

  const emoteName = getEmoteName(token);

  const actions = [
    {
      id: 'copy-name' as const,
      label: 'Copy name',
      onPress: () => copyWithToast(emoteName, 'Emote name copied'),
      visible: true,
    },
    {
      id: 'copy-url' as const,
      label: 'Copy image URL',
      onPress: () => copyWithToast(displayUrl, 'Emote URL copied'),
      visible: Boolean(displayUrl),
    },
    ...COPY_IMAGE_VARIANT_ACTIONS.map(action => ({
      id: action.id,
      label: `Copy ${action.scale} image URL`,
      onPress: () =>
        copyWithToast(
          scaledImageUrls[action.scale],
          `${action.scale} emote URL copied`,
        ),
      visible: Boolean(scaledImageUrls[action.scale]),
    })),
    {
      id: 'preview' as const,
      label: 'Preview',
      onPress: () =>
        onPress?.(
          displayUrl === token.url ? token : { ...token, url: displayUrl },
        ),
      visible: Boolean(onPress),
    },
  ].filter(action => action.visible);

  const layout: ChatSheetLayout = {
    chromeHeight: SHEET_CHROME.emoteActions,
    kind: 'content',
    sections: [{ rowCount: actions.length }],
  };

  return (
    <ChatSheet
      ref={sheetRef}
      layout={layout}
      onDismiss={onDismiss}
      testID='emote-action-sheet'
    >
      <View style={chatSheetStyles.wrapper}>
        <SheetHeader onClose={requestClose}>
          <View style={styles.identity}>
            {displayUrl ? (
              <View style={styles.previewImage}>
                <Image
                  trackLoadContext='chat.emote-action-sheet'
                  source={displayUrl}
                  cacheVariant='emote'
                  style={previewImageSize}
                  contentFit='contain'
                  transition={50}
                />
              </View>
            ) : null}
            <Text
              type='callout'
              family='brand'
              style={styles.previewName}
              numberOfLines={1}
            >
              {emoteName || 'Emote'}
            </Text>
          </View>
        </SheetHeader>
        <SheetActionGroup
          actions={actions.map(action => ({
            icon: getEmoteActionSFSymbolName(action.id),
            label: action.label,
            onPress: () => runAndClose(action.onPress),
          }))}
        />
      </View>
    </ChatSheet>
  );
}

export const EmoteActionSheet = memo(EmoteActionSheetComponent);

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
  previewImage: {
    alignItems: 'center',
    height: PREVIEW_IMAGE_MAX_SIZE,
    justifyContent: 'center',
    width: PREVIEW_IMAGE_MAX_SIZE,
  },
  previewName: {
    color: theme.color.text.dark,
    flexShrink: 1,
    fontSize: theme.fontSize20,
    fontWeight: '600',
    lineHeight: 25,
  },
});
