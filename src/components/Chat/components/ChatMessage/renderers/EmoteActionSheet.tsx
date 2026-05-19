import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { EmoteImageScale } from '@app/types/emote';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { pickEmoteVariantUrl } from '@app/utils/emote/emoteImageVariants';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import {
  ReactNode,
  useCallback,
  useMemo,
  useState,
  cloneElement,
  isValidElement,
  ReactElement,
} from 'react';
import {
  Modal,
  Platform,
  View,
  type GestureResponderEvent,
  StyleSheet,
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

interface EmoteActionSheetProps {
  disableAnimations?: boolean;
  part: PartVariant;
  onPress?: (part: PartVariant) => void;
  children: ReactNode;
}

export function EmoteActionSheet({
  disableAnimations = false,
  part,
  onPress,
  children,
}: EmoteActionSheetProps) {
  const [visible, setVisible] = useState(false);
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
          icon: 'copy',
          label: 'Copy name',
          onPress: copyName,
          visible: true,
        },
        {
          id: 'copy-url' as const,
          icon: 'copy',
          label: 'Copy image URL',
          onPress: copyImageUrl,
          visible: Boolean(displayUrl),
        },
        ...COPY_IMAGE_VARIANT_ACTIONS.map(action => ({
          id: action.id,
          icon: 'copy',
          label: action.label,
          onPress: () => copyScaledImageUrl(action.scale),
          visible: Boolean(part.image_variants),
        })),
        {
          id: 'preview' as const,
          icon: 'external-link',
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
      return meta.join(' • ');
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
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={closeSheet}
      >
        <View style={styles.wrapper}>
          {(displayUrl || part.name || part.original_name) && (
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                {displayUrl ? (
                  <View style={styles.previewImageContainer}>
                    <Image
                      useNitro
                      trackLoadTime
                      trackLoadContext="chat.emote-action-sheet"
                      source={displayUrl}
                      cacheVariant="emote"
                      style={styles.previewImage}
                      contentFit="contain"
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
                {Platform.OS === 'ios' ? (
                  <SymbolView
                    name={getSFSymbolName(action.id)}
                    size={19}
                    tintColor="#b7bdc9"
                    weight="regular"
                    style={styles.actionIcon}
                  />
                ) : (
                  <Icon icon={action.icon} color="#b7bdc9" size={18} />
                )}
                <Text style={styles.actionText}>{action.label}</Text>
              </Button>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: Platform.select({ ios: 56, android: 56 }),
    paddingHorizontal: theme.space16,
  },
  actionButtonWithDivider: {
    borderTopWidth: 0,
  },
  actionGroup: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    overflow: 'hidden',
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    fontWeight: Platform.select({ ios: '400', android: '400' }),
  },
  previewCard: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  previewHint: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize18,
    lineHeight: theme.fontSize18 * 1.2,
    marginTop: 4,
  },
  previewImage: {
    height: 56,
    width: 56,
  },
  previewImageContainer: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  previewMeta: {
    flex: 1,
  },
  previewName: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize24,
    fontWeight: Platform.select({ ios: '700', android: '600' }),
    lineHeight: theme.fontSize24 * 1.1,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
  },
  wrapper: {
    backgroundColor: '#171b23',
    flex: 1,
    gap: theme.space20,
    paddingBottom: theme.space28,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
});
