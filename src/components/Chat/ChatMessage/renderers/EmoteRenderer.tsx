import { memo, useCallback, useMemo } from 'react';
import { Text } from '@app/components/ui/Text/Text';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { View } from 'react-native';
import { ChatAssetContextMenu } from '../contextMenu/ChatAssetContextMenu';
import { ChatAssetContextPreview } from '../contextMenu/ChatAssetContextPreview';
import {
  buildEmoteMenuActions,
  createEmoteMenuActionHandler,
} from '../contextMenu/buildEmoteMenuActions';
import { ChatInlineImage } from './ChatInlineImage';

type PartVariant = ParsedPart<'emote'>;

interface EmoteRendererProps {
  disableAnimations?: boolean;
  part: PartVariant;
  onEmotePreview?: (part: PartVariant) => void;
  shouldOverlayPrevious?: boolean;
  targetSize?: number;
}

export const EmoteRenderer = memo(
  ({
    part,
    onEmotePreview,
    disableAnimations = false,
    shouldOverlayPrevious = false,
    targetSize = 30,
  }: EmoteRendererProps) => {
    const { height, width } = calculateAspectRatio(
      part.width || 20,
      part.height || 20,
      targetSize,
    );
    const displayUrl = getDisplayEmoteUrl({
      image_variants: part.image_variants,
      url: part.url,
      static_url: part.static_url,
      disableAnimations,
    });
    const menuActions = useMemo(
      () =>
        buildEmoteMenuActions({
          part,
          disableAnimations,
          includePreview: Boolean(onEmotePreview),
        }),
      [disableAnimations, onEmotePreview, part],
    );
    const handleMenuAction = useCallback(
      (actionId: string) => {
        createEmoteMenuActionHandler({
          part,
          disableAnimations,
          onPreview: onEmotePreview,
        })(actionId);
      },
      [disableAnimations, onEmotePreview, part],
    );
    const overlayStyle = getButtonStyle(width, shouldOverlayPrevious);
    const menuPreview = (
      <ChatAssetContextPreview
        cacheVariant='emote'
        showLabel={false}
        sourceHeight={part.height || 20}
        sourceUrl={displayUrl}
        sourceWidth={part.width || 20}
      />
    );

    if (!displayUrl) {
      const fallbackLabel = part.content || part.name;

      if (!fallbackLabel) {
        return (
          <ChatAssetContextMenu
            actions={menuActions}
            onPressAction={handleMenuAction}
            preview={menuPreview}
            style={overlayStyle}
          >
            <View
              style={getEmoteContainerStyle(width, height)}
              testID='chat-emote-placeholder'
            />
          </ChatAssetContextMenu>
        );
      }

      return (
        <ChatAssetContextMenu
          actions={menuActions}
          onPressAction={handleMenuAction}
          preview={menuPreview}
          style={overlayStyle}
        >
          <Text style={getNameStyle(width, height)}>{fallbackLabel}</Text>
        </ChatAssetContextMenu>
      );
    }

    return (
      <ChatAssetContextMenu
        actions={menuActions}
        onPressAction={handleMenuAction}
        preview={menuPreview}
        style={overlayStyle}
      >
        <ChatInlineImage
          cacheVariant='emote'
          containerStyle={getEmoteContainerStyle(width, height)}
          sourceUrl={displayUrl}
          style={{
            width,
            height,
          }}
        />
      </ChatAssetContextMenu>
    );
  },
);

function getEmoteContainerStyle(width: number, height: number) {
  return {
    width,
    height,
    overflow: 'hidden' as const,
  };
}

function getButtonStyle(width: number, shouldOverlayPrevious: boolean) {
  if (!shouldOverlayPrevious) {
    return undefined;
  }

  return {
    marginLeft: Math.round(width * -0.72),
    zIndex: 2,
  };
}

function getNameStyle(width: number, height: number) {
  return {
    width,
    height,
    textAlign: 'center' as const,
  };
}
