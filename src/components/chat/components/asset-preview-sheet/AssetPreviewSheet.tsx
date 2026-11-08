import { memo } from 'react';
import {
  type ImageStyle,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { toast } from 'sonner-native';

import { ChatDebugSection } from '@app/components/chat/components/ChatDebugSection';
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
  UNKNOWN_EMOTE_SIZE,
} from '@app/components/chat/components/sheet/util/fitToBox';
import { getEmoteName } from '@app/components/chat/components/sheet/util/getEmoteName';
import { getSheetEmoteUrl } from '@app/components/chat/components/sheet/util/getSheetEmoteUrl';
import {
  type SheetAction,
  SheetActionGroup,
  SheetDetailGroup,
} from '@app/components/chat/components/SheetActionGroup';
import { Image } from '@app/components/image/Image';
import { Text } from '@app/components/ui/text/Text';
import { useSaveImageToGallery } from '@app/hooks/use-save-image-to-gallery';
import { copyWithToast } from '@app/lib/clipboard';
import {
  getChatDebugBadgeDetails,
  getChatDebugBadgeSources,
  getChatDebugEmoteDetails,
  getChatDebugEmoteSources,
} from '@app/store/chat/actions/chat-debug-log';
import { usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

export type AssetPreviewSheetProps =
  | {
      asset: MessageToken<'emote'>;
      kind: 'emote';
      onDismiss: () => void;
    }
  | {
      asset: SanitisedBadgeSet;
      kind: 'badge';
      onDismiss: () => void;
    };

type AssetKind = AssetPreviewSheetProps['kind'];

const STAGE_HEIGHT = {
  badge: 128,
  emote: 152,
} as const satisfies Record<AssetKind, number>;

const BADGE_IMAGE_SIZE = 96;
const MIN_EMOTE_SIZE = 36;

interface AssetPreview {
  cacheVariant: AssetKind;
  caption?: string;
  details: { label: string; value?: string }[];
  imageStyle: ImageStyle;
  imageUrl: string;
  name: string;
  openUrl?: string;
  saveUrl?: string;
}

const ASSET_LABEL = {
  badge: 'Badge',
  emote: 'Emote',
} as const satisfies Record<AssetKind, string>;

function getEmoteImageSize(emote: MessageToken<'emote'>, screenWidth: number) {
  const maxEmoteSize = Math.min(Math.max(screenWidth * 0.36, 96), 156);
  const aspectRatio = getAssetAspectRatio(emote);
  const width = emote.width || UNKNOWN_EMOTE_SIZE;
  const height = emote.height || UNKNOWN_EMOTE_SIZE;

  const capped =
    width > maxEmoteSize || height > maxEmoteSize
      ? fitToBox(maxEmoteSize, aspectRatio)
      : { height, width };

  return capped.width < MIN_EMOTE_SIZE && capped.height < MIN_EMOTE_SIZE
    ? fitToBox(MIN_EMOTE_SIZE, aspectRatio)
    : capped;
}

interface BuildEmotePreviewOptions {
  disableAnimations: boolean;
  emote: MessageToken<'emote'>;
  screenWidth: number;
}

function buildEmotePreview({
  disableAnimations,
  emote,
  screenWidth,
}: BuildEmotePreviewOptions): AssetPreview {
  const name = getEmoteName(emote);

  return {
    cacheVariant: 'emote',
    caption: emote.site,
    details: [
      { label: 'Provider', value: emote.site },
      { label: 'Creator', value: emote.creator ?? undefined },
      {
        label: 'Original',
        value:
          emote.original_name && emote.original_name !== name
            ? emote.original_name
            : undefined,
      },
    ],
    imageStyle: {
      ...getEmoteImageSize(emote, screenWidth),
      borderCurve: 'continuous',
      borderRadius: theme.radius.md,
    },
    imageUrl: getSheetEmoteUrl(emote, disableAnimations),
    name,
    openUrl: emote.emote_link || undefined,
    saveUrl: getSheetEmoteUrl(emote, true),
  };
}

function buildBadgePreview(badge: SanitisedBadgeSet): AssetPreview {
  return {
    cacheVariant: 'badge',
    caption: badge.type,
    details: [
      { label: 'Type', value: badge.type },
      { label: 'Provider', value: badge.provider?.toUpperCase() },
      { label: 'Owner', value: badge.owner_username },
      { label: 'Set', value: badge.set },
      { label: 'ID', value: badge.id },
    ],
    imageStyle: { height: BADGE_IMAGE_SIZE, width: BADGE_IMAGE_SIZE },
    imageUrl: badge.url,
    name: badge.title,
    openUrl: badge.url || undefined,
    saveUrl: badge.url || undefined,
  };
}

function AssetPreviewSheetComponent(props: AssetPreviewSheetProps) {
  const { kind, onDismiss } = props;
  const { saveImage, isSaving } = useSaveImageToGallery();
  const { requestClose, sheetRef } = useChatSheet();
  const disableAnimations = usePreference('disableEmoteAnimations');
  const { width: screenWidth } = useWindowDimensions();

  const preview =
    props.kind === 'emote'
      ? buildEmotePreview({
          disableAnimations,
          emote: props.asset,
          screenWidth,
        })
      : buildBadgePreview(props.asset);

  const label = ASSET_LABEL[kind];
  const details = preview.details.filter(detail => Boolean(detail.value));
  const { openUrl, saveUrl } = preview;

  const actions: SheetAction[] = [
    {
      icon: 'doc.on.doc',
      label: `Copy ${kind} name`,
      onPress: () => copyWithToast(preview.name, `${label} name copied`),
    },
    {
      icon: 'link',
      label: `Copy ${kind} URL`,
      onPress: () => copyWithToast(preview.imageUrl, `${label} URL copied`),
    },
    ...(saveUrl
      ? [
          {
            icon: 'square.and.arrow.down' as const,
            label: 'Save image',
            disabled: isSaving,
            onPress: () =>
              saveImage(
                { url: saveUrl },
                {
                  onError: () => toast.error(`Could not save ${kind}`),
                  onSuccess: () => toast.success(`${label} saved to gallery`),
                },
              ),
          },
        ]
      : []),
    ...(openUrl
      ? [
          {
            icon: 'arrow.up.right.square' as const,
            label: 'Open in browser',
            onPress: () => openLinkInBrowser(openUrl),
          },
        ]
      : []),
  ];

  const layout: ChatSheetLayout = {
    chromeHeight: STAGE_HEIGHT[kind] + SHEET_CHROME.assetPreview,
    kind: 'content',
    minHeight: SHEET_CHROME.assetPreviewMinHeight,
    sections: [
      ...(details.length > 0
        ? [{ rowCount: details.length, titled: true }]
        : []),
      { rowCount: actions.length },
    ],
  };

  return (
    <ChatSheet
      ref={sheetRef}
      onDismiss={onDismiss}
      layout={layout}
      testID={`${kind}-preview-sheet`}
    >
      <View style={styles.container}>
        <SheetHeader title={preview.name} onClose={requestClose} />

        <ScrollView
          nestedScrollEnabled
          style={styles.scroll}
          contentContainerStyle={chatSheetStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewPanel}>
            <View style={[styles.imageStage, { height: STAGE_HEIGHT[kind] }]}>
              <Image
                trackLoadContext={`chat.${kind}-preview`}
                source={preview.imageUrl}
                cacheVariant={preview.cacheVariant}
                contentFit='contain'
                transition={kind === 'emote' ? 100 : 50}
                style={preview.imageStyle}
              />
            </View>
            {preview.caption ? (
              <Text type='footnote' color='gray.textLow' align='center'>
                {preview.caption}
              </Text>
            ) : null}
          </View>

          {details.length > 0 ? <SheetDetailGroup details={details} /> : null}

          <SheetActionGroup actions={actions} />

          <ChatDebugSection
            build={() => ({
              payload:
                props.kind === 'emote'
                  ? {
                      emote: props.asset,
                      emoteDetails: getChatDebugEmoteDetails(props.asset),
                      emoteSources: getChatDebugEmoteSources(),
                    }
                  : {
                      badge: props.asset,
                      badgeDetails: getChatDebugBadgeDetails(props.asset),
                      badgeSources: getChatDebugBadgeSources(),
                    },
            })}
          />
        </ScrollView>
      </View>
    </ChatSheet>
  );
}

export const AssetPreviewSheet = memo(AssetPreviewSheetComponent);

const styles = StyleSheet.create({
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
});
