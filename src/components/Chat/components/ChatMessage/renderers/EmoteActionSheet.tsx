import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
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
        url: part.url,
        static_url: part.static_url,
        disableAnimations,
      }),
    [disableAnimations, part.static_url, part.url],
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
    if (!text) return;
    void Clipboard.setStringAsync(text).then(() => {
      toast.success('Emote name copied to clipboard');
    });
  }, [part.name, part.original_name, closeSheet]);

  const copyImageUrl = useCallback(() => {
    closeSheet();
    if (!displayUrl) return;
    void Clipboard.setStringAsync(displayUrl).then(() => {
      toast.success('Emote URL copied to clipboard');
    });
  }, [closeSheet, displayUrl]);

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
        {
          id: 'preview' as const,
          icon: 'external-link',
          label: 'Preview',
          onPress: handlePreview,
          visible: Boolean(onPress),
        },
      ].filter(action => action.visible),
    [copyImageUrl, copyName, displayUrl, handlePreview, onPress],
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

  const getSFSymbolName = useCallback(
    (actionId: 'copy-name' | 'copy-url' | 'preview') => {
      switch (actionId) {
        case 'copy-name':
        case 'copy-url':
          return 'doc.on.doc' as const;
        case 'preview':
          return 'arrow.up.right.square' as const;

        default:
          return 'doc.on.doc' as const;
      }
    },
    [],
  );

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
                      source={displayUrl}
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
    gap: theme.spacing.sm,
    minHeight: Platform.select({ ios: 56, android: 56 }),
    paddingHorizontal: theme.spacing.md,
  },
  actionButtonWithDivider: {
    borderTopWidth: 0,
  },
  actionGroup: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.md,
    fontWeight: Platform.select({ ios: '400', android: '400' }),
  },
  previewCard: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  previewHint: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.lg,
    lineHeight: theme.font.fontSize.lg * 1.2,
    marginTop: 4,
  },
  previewImage: {
    height: 56,
    width: 56,
  },
  previewImageContainer: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  previewMeta: {
    flex: 1,
  },
  previewName: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize['2xl'],
    fontWeight: Platform.select({ ios: '700', android: '600' }),
    lineHeight: theme.font.fontSize['2xl'] * 1.1,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  wrapper: {
    backgroundColor: '#171b23',
    flex: 1,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
});
