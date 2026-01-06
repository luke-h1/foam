import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/Text/Text';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import { Modal, View, Dimensions, LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { toast } from 'sonner-native';

interface Props {
  selectedEmote: ParsedPart<'emote'> | null;
  anchorPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  isVisible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MAX_EMOTE_SIZE = Math.min(screenWidth * 0.3, 100);
const MIN_EMOTE_SIZE = 32;
const POPOVER_PADDING = 12;
const ARROW_SIZE = 8;

export function EmotePopover({
  selectedEmote,
  anchorPosition,
  isVisible,
  onClose,
}: Props) {
  const [popoverLayout, setPopoverLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const getEmoteSize = useCallback(() => {
    if (!selectedEmote) return { width: 0, height: 0 };

    const originalWidth = selectedEmote.width || 28;
    const originalHeight = selectedEmote.height || 28;

    const aspectRatio = originalWidth / originalHeight;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (targetWidth > MAX_EMOTE_SIZE || targetHeight > MAX_EMOTE_SIZE) {
      if (aspectRatio > 1) {
        targetWidth = MAX_EMOTE_SIZE;
        targetHeight = MAX_EMOTE_SIZE / aspectRatio;
      } else {
        targetHeight = MAX_EMOTE_SIZE;
        targetWidth = MAX_EMOTE_SIZE * aspectRatio;
      }
    }

    if (targetWidth < MIN_EMOTE_SIZE && targetHeight < MIN_EMOTE_SIZE) {
      if (aspectRatio > 1) {
        targetWidth = MIN_EMOTE_SIZE;
        targetHeight = MIN_EMOTE_SIZE / aspectRatio;
      } else {
        targetHeight = MIN_EMOTE_SIZE;
        targetWidth = MIN_EMOTE_SIZE * aspectRatio;
      }
    }

    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
    };
  }, [selectedEmote]);

  const emoteSize = getEmoteSize();

  const handleCopy = useCallback(
    (field: 'name' | 'url') => {
      if (!selectedEmote) return;
      void Clipboard.setStringAsync(
        field === 'name'
          ? selectedEmote.content
          : (selectedEmote.url as string),
      ).then(() =>
        toast.success(
          `${field === 'name' ? 'Emote name' : 'Emote URL'} copied`,
        ),
      );
      onClose();
    },
    [selectedEmote, onClose],
  );

  const actions = useMemo(
    () => [
      {
        icon: 'copy' as const,
        label: 'Copy emote name',
        onPress: () => handleCopy('name'),
      },
      {
        icon: 'copy' as const,
        label: 'Copy emote URL',
        onPress: () => handleCopy('url'),
      },
      {
        icon: 'external-link' as const,
        label: 'Open in Browser',
        onPress: () => {
          if (selectedEmote?.emote_link) {
            openLinkInBrowser(selectedEmote.emote_link);
          }
          onClose();
        },
      },
    ],
    [handleCopy, selectedEmote?.emote_link, onClose],
  );

  const onPopoverLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPopoverLayout({ width, height });
  }, []);

  const popoverPosition = useMemo(() => {
    if (!anchorPosition || !popoverLayout) {
      return { top: 0, left: 0, arrowPosition: 'bottom' as const };
    }

    const { x, y, width: anchorWidth, height: anchorHeight } = anchorPosition;
    const { width: popoverWidth, height: popoverHeight } = popoverLayout;

    // Calculate center of anchor
    const anchorCenterX = x + anchorWidth / 2;

    // Try to position popover above the emote (arrow pointing down)
    let top = y - popoverHeight - ARROW_SIZE;
    let left = anchorCenterX - popoverWidth / 2;
    let arrowPosition: 'top' | 'bottom' = 'bottom';

    // If popover would go off screen, position it below (arrow pointing up)
    if (top < 0) {
      top = y + anchorHeight + ARROW_SIZE;
      arrowPosition = 'top';
    }

    // Adjust horizontal position to keep within screen bounds
    if (left < POPOVER_PADDING) {
      left = POPOVER_PADDING;
    } else if (left + popoverWidth > screenWidth - POPOVER_PADDING) {
      left = screenWidth - popoverWidth - POPOVER_PADDING;
    }

    // Calculate arrow offset from center
    const arrowOffset = anchorCenterX - left;

    return {
      top: Math.max(
        POPOVER_PADDING,
        Math.min(top, screenHeight - popoverHeight - POPOVER_PADDING),
      ),
      left: Math.max(
        POPOVER_PADDING,
        Math.min(left, screenWidth - popoverWidth - POPOVER_PADDING),
      ),
      arrowPosition,
      arrowOffset: Math.max(20, Math.min(arrowOffset, popoverWidth - 20)),
    };
  }, [anchorPosition, popoverLayout]);

  if (!selectedEmote || !isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <PressableArea style={styles.overlay} onPress={onClose}>
        <PressableArea
          style={[
            styles.popover,
            {
              top: popoverPosition.top,
              left: popoverPosition.left,
            },
          ]}
          onLayout={onPopoverLayout}
          onStartShouldSetResponder={() => true}
        >
          {/* Arrow */}
          <View
            style={[
              styles.arrow,
              popoverPosition.arrowPosition === 'top'
                ? styles.arrowTop
                : styles.arrowBottom,
              {
                left: popoverPosition.arrowOffset,
              },
            ]}
          />

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.emoteContainer}>
                <Image
                  source={selectedEmote.url ?? ''}
                  transition={100}
                  style={[styles.emoteImage, emoteSize]}
                />
              </View>

              <View style={styles.emoteInfo}>
                <Text style={styles.emoteName} numberOfLines={2}>
                  {selectedEmote?.name}
                </Text>

                <View style={styles.metadataContainer}>
                  <Text style={styles.emoteMetadata}>{selectedEmote.site}</Text>
                  {selectedEmote.creator && (
                    <Text style={styles.emoteMetadata}>
                      By {selectedEmote.creator}
                    </Text>
                  )}
                  {selectedEmote.original_name &&
                    selectedEmote.original_name !== selectedEmote.name && (
                      <Text style={styles.emoteMetadata}>
                        Original: {selectedEmote.original_name}
                      </Text>
                    )}
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <Button
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  onPress={action.onPress}
                  style={styles.actionButton}
                >
                  <View style={styles.actionContent}>
                    <Icon icon={action.icon} color="#fff" size={16} />
                    <Text style={styles.actionText}>{action.label}</Text>
                  </View>
                </Button>
              ))}
            </View>
          </View>
        </PressableArea>
      </PressableArea>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popover: {
    position: 'absolute',
    backgroundColor: theme.colors.gray.bgAlt,
    borderRadius: theme.radii.lg,
    borderCurve: 'continuous',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 12,
    minWidth: 200,
    maxWidth: screenWidth - POPOVER_PADDING * 2,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowTop: {
    top: -ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderBottomColor: theme.colors.gray.bgAlt,
  },
  arrowBottom: {
    bottom: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderTopColor: theme.colors.gray.bgAlt,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  emoteContainer: {
    backgroundColor: theme.colors.gray.bg,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  emoteImage: {
    borderRadius: theme.radii.sm,
  },
  emoteInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  emoteName: {
    fontSize: theme.font.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.gray.text,
    marginBottom: theme.spacing.xs,
  },
  metadataContainer: {
    gap: theme.spacing.xs / 2,
  },
  emoteMetadata: {
    fontSize: theme.font.fontSize.xs,
    color: theme.colors.gray.textLow,
    lineHeight: theme.font.fontSize.xs * 1.3,
  },
  actionsContainer: {
    gap: theme.spacing.xs,
  },
  actionButton: {
    backgroundColor: theme.colors.gray.bg,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.sm,
  },
  actionText: {
    fontSize: theme.font.fontSize.sm,
    color: theme.colors.gray.text,
    fontWeight: 'normal',
  },
}));
