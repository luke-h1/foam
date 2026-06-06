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
  useState,
  cloneElement,
  isValidElement,
  ReactElement,
  useCallback,
  useMemo,
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
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
  const isControlled = typeof isPresented === 'boolean';
  const visible = isControlled ? isPresented : uncontrolledVisible;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(windowWidth - theme.space16 * 2, 520),
  );
  const wrapperStyle = [
    styles.wrapper,
    {
      maxHeight: Math.round(windowHeight * 0.72),
      width: sheetWidth,
    },
  ];
  const displayUrl = getDisplayEmoteUrl({
    image_variants: part.image_variants,
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
  ].filter(action => action.visible);

  const previewSubtitle = 'Emote actions';

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
                      name={getEmoteActionSFSymbolName(action.id)}
                      size={18}
                      tintColor={theme.color.textSecondary.dark}
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
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: Platform.select({ ios: 56, android: 56 }),
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  actionButtonWithDivider: {
    borderTopColor: 'rgba(255,255,255,0.055)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
  },
  actionGroup: {
    backgroundColor: '#18191d',
    borderColor: 'rgba(255,255,255,0.10)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0 10px 18px rgba(0, 0, 0, 0.22)',
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    lineHeight: theme.fontSize16 * 1.18,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: '#1f2024',
    borderColor: 'rgba(255,255,255,0.08)',
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
    paddingHorizontal: 2,
    paddingVertical: theme.space4,
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
    backgroundColor: '#19191c',
    borderColor: 'rgba(255,255,255,0.065)',
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'space-between',
    paddingBottom: theme.space8,
  },
  wrapper: {
    gap: theme.space12,
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
  },
});
