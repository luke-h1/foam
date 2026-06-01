import { Button } from '@app/components/Button/Button';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { SymbolView } from 'expo-symbols';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { EmoteImageScale } from '@app/types/emote';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { pickEmoteVariantUrl } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import * as Clipboard from 'expo-clipboard';
import {
  ReactNode,
  useCallback,
  useMemo,
  useState,
  cloneElement,
  isValidElement,
  ReactElement,
  memo,
} from 'react';
import {
  Platform,
  View,
  type GestureResponderEvent,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { toast } from 'sonner-native';
import {
  CHAT_SHEET_BACKGROUND,
  chatSheetSurface,
} from '../../chatSheetSurface';

type PartVariant = ParsedPart<'emote'>;
type ActionId =
  | 'copy-name'
  | 'copy-url'
  | 'copy-url-2x'
  | 'copy-url-4x'
  | 'preview';

const COPY_IMAGE_VARIANT_ACTIONS = [
  { id: 'copy-url-2x', label: 'Copy 2x image URL', scale: '2x' },
  { id: 'copy-url-4x', label: 'Copy 4x image URL', scale: '4x' },
] as const;

interface EmoteActionSheetProps {
  disableAnimations?: boolean;
  part: PartVariant;
  onPress?: (part: PartVariant) => void;
  children: ReactNode;
}

function EmoteActionSheetComponent({
  disableAnimations = false,
  part,
  onPress,
  children,
}: EmoteActionSheetProps) {
  const [visible, setVisible] = useState(false);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(windowWidth - theme.space16 * 2, 520),
  );
  const wrapperStyle = useMemo(
    () => [
      styles.wrapper,
      {
        maxHeight: Math.round(windowHeight * 0.72),
        width: sheetWidth,
      },
    ],
    [sheetWidth, windowHeight],
  );
  const displayUrl = useMemo(
    () =>
      getDisplayEmoteUrl({
        image_variants: part.image_variants,
        url: part.url,
        static_url: part.static_url,
        disableAnimations,
      }),
    [disableAnimations, part.image_variants, part.static_url, part.url],
  );
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

  const openSheet = useCallback((e: GestureResponderEvent) => {
    e?.preventDefault?.();
    setVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setVisible(false);
  }, []);

  const copyName = useCallback(() => {
    closeSheet();
    const text = part.name ?? part.original_name ?? '';
    if (!text) {
      return;
    }
    void Clipboard.setStringAsync(text).then(() => {
      toast.success('Emote name copied to clipboard');
    });
  }, [part.name, part.original_name, closeSheet]);

  const copyImageUrl = useCallback(() => {
    closeSheet();
    if (!displayUrl) {
      return;
    }
    void Clipboard.setStringAsync(displayUrl).then(() => {
      toast.success('Emote URL copied to clipboard');
    });
  }, [closeSheet, displayUrl]);

  const copyScaledImageUrl = useCallback(
    (scale: EmoteImageScale) => {
      closeSheet();
      const url = pickEmoteVariantUrl({
        fallbackUrl: displayUrl,
        imageVariants: part.image_variants,
        preferredKind: disableAnimations ? 'static' : 'animated',
        preferredScale: scale,
      });
      if (!url) {
        return;
      }
      void Clipboard.setStringAsync(url).then(() => {
        toast.success(`${scale} emote URL copied to clipboard`);
      });
    },
    [closeSheet, disableAnimations, displayUrl, part.image_variants],
  );

  const handlePreview = useCallback(() => {
    closeSheet();
    onPress?.(previewPart);
  }, [closeSheet, onPress, previewPart]);

  const actions = useMemo(
    () =>
      [
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
          label: action.label,
          onPress: () => copyScaledImageUrl(action.scale),
          visible: Boolean(part.image_variants),
        })),
        {
          id: 'preview' as const,
          label: 'Preview',
          onPress: handlePreview,
          visible: Boolean(onPress),
        },
      ].filter(action => action.visible),
    [
      copyImageUrl,
      copyName,
      copyScaledImageUrl,
      displayUrl,
      handlePreview,
      onPress,
      part.image_variants,
    ],
  );

  const previewSubtitle = useMemo(() => {
    const meta: string[] = [];
    if (part.creator) {
      meta.push(part.creator);
    }
    if (part.site) {
      meta.push(part.site);
    }

    if (meta.length > 0) {
      return meta.join(' / ');
    }

    return 'Emote actions';
  }, [part.creator, part.site]);

  const getSFSymbolName = useCallback((actionId: ActionId) => {
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
  }, []);

  const triggerChild = isValidElement(children)
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
      {visible ? (
        <BottomSheet
          isPresented={visible}
          onDismiss={closeSheet}
          showDragIndicator
          testID='emote-action-sheet'
        >
          <View style={wrapperStyle}>
            <View style={styles.topBar}>
              <View style={styles.heading}>
                <Text style={styles.eyebrow} weight='semibold'>
                  Emote actions
                </Text>
              </View>
              <Button
                label='Done'
                style={styles.doneButton}
                onPress={closeSheet}
              >
                <SymbolView
                  name='checkmark'
                  size={18}
                  tintColor={theme.color.text.dark}
                />
              </Button>
            </View>
            {(displayUrl || part.name || part.original_name) && (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  {displayUrl ? (
                    <View style={styles.previewImageContainer}>
                      <Image
                        useNitro
                        trackLoadTime
                        trackLoadContext='chat.emote-action-sheet'
                        source={displayUrl}
                        cacheVariant='emote'
                        style={styles.previewImage}
                        contentFit='contain'
                        transition={50}
                      />
                    </View>
                  ) : null}
                  <View style={styles.previewMeta}>
                    {part.name || part.original_name ? (
                      <Text style={styles.previewName}>
                        {part.name ?? part.original_name}
                      </Text>
                    ) : null}
                    <Text style={styles.previewHint}>{previewSubtitle}</Text>
                  </View>
                </View>
              </View>
            )}
            <View style={styles.actionGroup}>
              {actions.map((action, index) => (
                <Button
                  key={action.label}
                  onPress={action.onPress}
                  style={[
                    styles.actionButton,
                    index > 0 && styles.actionButtonWithDivider,
                  ]}
                >
                  <View style={styles.actionIconFrame}>
                    <SymbolView
                      name={getSFSymbolName(action.id)}
                      size={18}
                      tintColor={theme.colorGreen}
                      weight='regular'
                      style={styles.actionIcon}
                    />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={styles.actionText} weight='semibold'>
                      {action.label}
                    </Text>
                  </View>
                </Button>
              ))}
            </View>
          </View>
        </BottomSheet>
      ) : null}
    </>
  );
}

export const EmoteActionSheet = memo(EmoteActionSheetComponent);

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: Platform.select({ ios: 52, android: 52 }),
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  actionButtonWithDivider: {
    borderTopColor: 'rgba(255,255,255,0.075)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
  },
  actionGroup: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.18)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.25,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  eyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  heading: {
    flex: 1,
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    padding: theme.space16,
  },
  previewHint: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
    marginTop: 4,
  },
  previewImage: {
    height: 56,
    width: 56,
  },
  previewImageContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  previewMeta: {
    flex: 1,
  },
  previewName: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize18,
    fontWeight: Platform.select({ ios: '700', android: '600' }),
    lineHeight: theme.fontSize18 * 1.2,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'space-between',
    paddingBottom: theme.space4,
  },
  wrapper: {
    ...chatSheetSurface,
    backgroundColor: CHAT_SHEET_BACKGROUND,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    gap: theme.space12,
    paddingBottom: theme.space16,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
  },
});
