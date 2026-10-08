import {
  cloneElement,
  isValidElement,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type GestureResponderEvent,
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
import { SheetHeader } from '@app/components/chat/components/sheet/sheet-header';
import { SheetActionGroup } from '@app/components/chat/components/sheet-action-group';
import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { EmoteImageScale } from '@app/types/emote';
import { MessageToken } from '@app/utils/chat/message-token';
import { deriveEmoteImageVariantsFromUrl } from '@app/utils/emote/emote-image-variants/derive-emote-image-variants-from-url';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolve-emote-display-url';

type MessageTokenKind = MessageToken<'emote'>;

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
    default:
      return 'doc.on.doc' as const;
  }
}

interface EmoteActionSheetProps {
  children?: ReactNode;
  disableAnimations?: boolean;
  isPresented?: boolean;
  onDismiss?: () => void;
  onPress?: (token: MessageTokenKind) => void;
  token: MessageTokenKind;
}

function EmoteActionSheetComponent({
  children,
  disableAnimations = false,
  isPresented,
  onDismiss,
  token,
  onPress,
}: EmoteActionSheetProps) {
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const isControlled = isPresented !== undefined;
  const visible = isControlled ? isPresented : uncontrolledVisible;
  const { height: windowHeight } = useWindowDimensions();

  const wrapperStyle = [
    styles.wrapper,
    {
      maxHeight: Math.round(windowHeight * 0.72),
    },
  ];

  const resolvedImageVariants = useMemo(
    () => token.image_variants ?? deriveEmoteImageVariantsFromUrl(token.url),
    [token.image_variants, token.url],
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

  const displayUrl = resolveEmoteDisplayUrl(
    {
      image_variants: resolvedImageVariants,
      url: token.url,
      static_url: token.static_url,
    },
    { disableAnimations, preferredScale: '4x' },
  );

  const previewPart = useMemo(
    () =>
      displayUrl === token.url
        ? token
        : {
            ...token,
            url: displayUrl,
          },
    [displayUrl, token],
  );

  const previewImageSize = useMemo(() => {
    const aspectRatio = (token.width || 28) / (token.height || 28);

    return aspectRatio >= 1
      ? {
          width: PREVIEW_IMAGE_MAX_SIZE,
          height: Math.round(PREVIEW_IMAGE_MAX_SIZE / aspectRatio),
        }
      : {
          width: Math.round(PREVIEW_IMAGE_MAX_SIZE * aspectRatio),
          height: PREVIEW_IMAGE_MAX_SIZE,
        };
  }, [token.width, token.height]);

  const openSheet = useCallback(
    (e: GestureResponderEvent) => {
      e?.preventDefault?.();
      if (!isControlled) {
        setUncontrolledVisible(true);
      }
    },
    [isControlled],
  );

  const closeSheet = useCallback(() => {
    if (isControlled) {
      onDismiss?.();
      return;
    }

    setUncontrolledVisible(false);
  }, [isControlled, onDismiss]);

  const requestClose = useCallback(() => {
    sheetRef.current?.requestClose();
  }, []);

  const copyName = useCallback(() => {
    requestClose();
    const text = token.name ?? token.original_name ?? '';

    if (!text) {
      return;
    }

    void Clipboard.setStringAsync(text).then(() => {
      toast.success('Copied emote name');
    });
  }, [token.name, token.original_name, requestClose]);

  const copyImageUrl = useCallback(() => {
    requestClose();

    if (!displayUrl) {
      return;
    }

    void Clipboard.setStringAsync(displayUrl).then(() => {
      toast.success('Copied emote URL');
    });
  }, [displayUrl, requestClose]);

  const copyScaledImageUrl = useCallback(
    (scale: EmoteImageScale) => {
      requestClose();
      const url = scaledImageUrls[scale];

      if (!url) {
        return;
      }

      void Clipboard.setStringAsync(url).then(() => {
        toast.success(`Copied ${scale} emote URL`);
      });
    },
    [requestClose, scaledImageUrls],
  );

  const handlePreview = useCallback(() => {
    requestClose();
    onPress?.(previewPart);
  }, [onPress, previewPart, requestClose]);

  const actions = [
    {
      id: 'copy-name' as const,
      label: 'Copy name',
      onPress: copyName,
      visible: true,
    },
    {
      id: 'copy-url' as const,
      label: 'Copy image URL',
      onPress: copyImageUrl,
      visible: Boolean(displayUrl),
    },
    ...COPY_IMAGE_VARIANT_ACTIONS.map(action => ({
      id: action.id,
      label: `Copy ${action.scale} image URL`,
      onPress: () => copyScaledImageUrl(action.scale),
      visible: Boolean(scaledImageUrls[action.scale]),
    })),
    {
      id: 'preview' as const,
      label: 'Preview',
      onPress: handlePreview,
      visible: Boolean(onPress),
    },
  ].filter(action => action.visible);

  // SAFETY: the trigger child is the pressable this sheet wraps, and onLongPress is the only prop cloned onto it.
  const triggerChild =
    children && isValidElement(children)
      ? cloneElement(
          children as ReactElement<{
            onLongPress?: (e: GestureResponderEvent) => void;
          }>,
          {
            onLongPress: openSheet,
          },
        )
      : children;

  return (
    <>
      {triggerChild}
      <BottomSheet
        ref={sheetRef}
        isPresented={visible}
        onDismiss={closeSheet}
        showDragIndicator
        testID='emote-action-sheet'
      >
        <View style={wrapperStyle}>
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
                {token.name ?? token.original_name ?? 'Emote'}
              </Text>
            </View>
          </SheetHeader>
          <SheetActionGroup
            actions={actions.map(action => ({
              icon: getEmoteActionSFSymbolName(action.id),
              label: action.label,
              onPress: action.onPress,
            }))}
          />
        </View>
      </BottomSheet>
    </>
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
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  previewName: {
    color: theme.color.text.dark,
    flexShrink: 1,
    fontSize: theme.fontSize20,
    fontWeight: '600',
    lineHeight: 25,
  },
  /**
   * No bottom padding: the action group's `SettingsSection` carries a bottom
   * margin of the same size.
   */
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.space20,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
    width: '100%',
  },
});
