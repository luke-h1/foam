import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
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
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { toast } from 'sonner-native';

type PartVariant = ParsedPart<'emote'>;

interface EmoteActionSheetProps {
  part: PartVariant;
  onPress?: (part: PartVariant) => void;
  children: ReactNode;
}

export function EmoteActionSheet({
  part,
  onPress,
  children,
}: EmoteActionSheetProps) {
  const [visible, setVisible] = useState(false);

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
    if (!part.url) return;
    void Clipboard.setStringAsync(part.url).then(() => {
      toast.success('Emote URL copied to clipboard');
    });
  }, [part.url, closeSheet]);

  const handlePreview = useCallback(() => {
    closeSheet();
    onPress?.(part);
  }, [onPress, part, closeSheet]);

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
          visible: Boolean(part.url),
        },
        {
          id: 'preview' as const,
          icon: 'external-link',
          label: 'Preview',
          onPress: handlePreview,
          visible: Boolean(onPress),
        },
      ].filter(action => action.visible),
    [copyImageUrl, copyName, handlePreview, onPress, part.url],
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
          {(part.url || part.name || part.original_name) && (
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                {part.url ? (
                  <View style={styles.previewImageContainer}>
                    <Image
                      useNitro
                      source={part.url}
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

const styles = StyleSheet.create(theme => ({
  wrapper: {
    flex: 1,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.lg,
    backgroundColor: '#171b23',
  },
  actionGroup: {
    borderRadius: theme.radii.xl,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: Platform.select({ ios: 56, android: 56 }),
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  actionButtonWithDivider: {
    borderTopWidth: 0,
  },
  actionText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.md,
    fontWeight: Platform.select({ ios: '400', android: '400' }),
  },
  actionIcon: {
    opacity: 0.9,
  },
  previewCard: {
    borderRadius: theme.radii.xl,
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  previewImageContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 56,
    height: 56,
  },
  previewMeta: {
    flex: 1,
  },
  previewName: {
    color: theme.colors.gray.text,
    fontWeight: Platform.select({ ios: '700', android: '600' }),
    fontSize: theme.font.fontSize['2xl'],
    lineHeight: theme.font.fontSize['2xl'] * 1.1,
  },
  previewHint: {
    color: theme.colors.gray.textLow,
    marginTop: 4,
    fontSize: theme.font.fontSize.lg,
    lineHeight: theme.font.fontSize.lg * 1.2,
  },
}));
