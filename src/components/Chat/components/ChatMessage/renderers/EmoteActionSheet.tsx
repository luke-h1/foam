import {
  cloneElement,
  isValidElement,
  memo,
  ReactElement,
  ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type GestureResponderEvent,
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
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';
import type { EmoteImageScale } from '@app/types/emote';
import { ParsedPart } from '@app/utils/chat/parsedPart';
import { deriveEmoteImageVariantsFromUrl } from '@app/utils/emote/emoteImageVariants/deriveEmoteImageVariantsFromUrl';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

import { EmoteActionSheetPreview } from './EmoteActionSheetPreview';
import {
  type EmoteActionRow,
  EmoteActionSheetRows,
} from './EmoteActionSheetRows';

type PartVariant = ParsedPart<'emote'>;

const COPY_IMAGE_VARIANT_ACTIONS = [
  { id: 'copy-url-2x', scale: '2x' },
  { id: 'copy-url-4x', scale: '4x' },
] as const;

const PREVIEW_IMAGE_MAX_SIZE = 56;

interface EmoteActionSheetProps {
  children?: ReactNode;
  disableAnimations?: boolean;
  isPresented?: boolean;
  onDismiss?: () => void;
  onPress?: (part: PartVariant) => void;
  part: PartVariant;
}

function EmoteActionSheetComponent({
  children,
  disableAnimations = false,
  isPresented,
  onDismiss,
  part,
  onPress,
}: EmoteActionSheetProps) {
  const { t } = useTranslation(['chat', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const isControlled = typeof isPresented === 'boolean';
  const visible = isControlled ? isPresented : uncontrolledVisible;
  const { height: windowHeight } = useWindowDimensions();
  const wrapperStyle = [
    styles.wrapper,
    {
      maxHeight: Math.round(windowHeight * 0.72),
    },
  ];
  const resolvedImageVariants = useMemo(
    () => part.image_variants ?? deriveEmoteImageVariantsFromUrl(part.url),
    [part.image_variants, part.url],
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
  const displayUrl = getDisplayEmoteUrl({
    image_variants: resolvedImageVariants,
    url: part.url,
    static_url: part.static_url,
    disableAnimations,
  });
  const previewPart = useMemo(
    () =>
      displayUrl === part.url
        ? part
        : {
            ...part,
            url: displayUrl,
          },
    [displayUrl, part],
  );

  const previewImageSize = useMemo(() => {
    const aspectRatio = (part.width || 28) / (part.height || 28);
    return aspectRatio >= 1
      ? {
          width: PREVIEW_IMAGE_MAX_SIZE,
          height: Math.round(PREVIEW_IMAGE_MAX_SIZE / aspectRatio),
        }
      : {
          width: Math.round(PREVIEW_IMAGE_MAX_SIZE * aspectRatio),
          height: PREVIEW_IMAGE_MAX_SIZE,
        };
  }, [part.width, part.height]);

  const openSheet = (e: GestureResponderEvent) => {
    e?.preventDefault?.();
    if (!isControlled) {
      setUncontrolledVisible(true);
    }
  };

  const closeSheet = () => {
    if (isControlled) {
      onDismiss?.();
      return;
    }

    setUncontrolledVisible(false);
  };

  const requestClose = () => {
    sheetRef.current?.requestClose();
  };

  const copyName = () => {
    requestClose();
    const text = part.name ?? part.original_name ?? '';
    if (!text) {
      return;
    }
    void Clipboard.setStringAsync(text).then(() => {
      toast.success(i18next.t('chat:emoteActions.nameCopied'));
    });
  };

  const copyImageUrl = () => {
    requestClose();
    if (!displayUrl) {
      return;
    }
    void Clipboard.setStringAsync(displayUrl).then(() => {
      toast.success(i18next.t('chat:emoteActions.urlCopied'));
    });
  };

  const copyScaledImageUrl = (scale: EmoteImageScale) => {
    requestClose();
    const url = scaledImageUrls[scale];
    if (!url) {
      return;
    }
    void Clipboard.setStringAsync(url).then(() => {
      toast.success(i18next.t('chat:emoteActions.scaledUrlCopied', { scale }));
    });
  };

  const handlePreview = () => {
    requestClose();
    onPress?.(previewPart);
  };

  const actions: EmoteActionRow[] = [
    {
      id: 'copy-name',
      label: t('emoteActions.copyName'),
      onPress: copyName,
    },
    ...(displayUrl
      ? ([
          {
            id: 'copy-url',
            label: t('emoteActions.copyImageUrl'),
            onPress: copyImageUrl,
          },
        ] as const)
      : []),
    ...(scaledImageUrls['2x']
      ? ([
          {
            id: 'copy-url-2x',
            label: t('emoteActions.copyScaledImageUrl', { scale: '2x' }),
            onPress: () => copyScaledImageUrl('2x'),
          },
        ] as const)
      : []),
    ...(scaledImageUrls['4x']
      ? ([
          {
            id: 'copy-url-4x',
            label: t('emoteActions.copyScaledImageUrl', { scale: '4x' }),
            onPress: () => copyScaledImageUrl('4x'),
          },
        ] as const)
      : []),
    ...(onPress
      ? ([
          {
            id: 'preview',
            label: t('emoteActions.preview'),
            onPress: handlePreview,
          },
        ] as const)
      : []),
  ];

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
          <View style={styles.topBar}>
            <View style={styles.heading}>
              <Text
                style={[
                  styles.eyebrow,
                  { color: theme.color.textSecondary[scheme] },
                ]}
                weight='semibold'
              >
                {t('emoteActions.title')}
              </Text>
            </View>
            <Button
              label={t('common:done')}
              style={[
                styles.doneButton,
                { backgroundColor: theme.color.pressedOverlay[scheme] },
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
          <EmoteActionSheetPreview
            displayUrl={displayUrl}
            name={part.name ?? part.original_name ?? undefined}
            subtitle={t('emoteActions.title')}
            imageSize={previewImageSize}
          />
          <EmoteActionSheetRows actions={actions} />
        </View>
      </BottomSheet>
    </>
  );
}

export const EmoteActionSheet = memo(EmoteActionSheetComponent);

const styles = StyleSheet.create({
  doneButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  eyebrow: {
    fontSize: theme.fontSize11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heading: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'space-between',
    paddingBottom: theme.space8,
  },
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.space12,
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
    width: '100%',
  },
});
