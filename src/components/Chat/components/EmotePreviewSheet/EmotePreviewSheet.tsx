/* eslint-disable react-native/no-unused-styles, react-native/sort-styles */
import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo } from 'react';
import { Dimensions, Modal, View, StyleSheet } from 'react-native';
import { toast } from 'sonner-native';

interface Props {
  disableAnimations?: boolean;
  visible: boolean;
  onClose: () => void;
  selectedEmote: ParsedPart<'emote'>;
}

const { width: screenWidth } = Dimensions.get('window');
const MAX_EMOTE_SIZE = Math.min(screenWidth * 0.4, 120); // 40% of screen width or 120px max
const MIN_EMOTE_SIZE = 32;

export function EmotePreviewSheet(props: Props) {
  const { visible, onClose, selectedEmote, disableAnimations = false } = props;
  const displayUrl = useMemo(
    () =>
      getDisplayEmoteUrl({
        url: selectedEmote.url,
        static_url: selectedEmote.static_url,
        disableAnimations,
      }),
    [disableAnimations, selectedEmote.static_url, selectedEmote.url],
  );

  const getEmoteSize = useCallback(() => {
    const originalWidth = selectedEmote.width || 28;
    const originalHeight = selectedEmote.height || 28;

    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;

    // Determine the best size that fits within our constraints
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    // If emote is too large, scale it down proportionally
    if (targetWidth > MAX_EMOTE_SIZE || targetHeight > MAX_EMOTE_SIZE) {
      if (aspectRatio > 1) {
        // Wide emote - constrain by width
        targetWidth = MAX_EMOTE_SIZE;
        targetHeight = MAX_EMOTE_SIZE / aspectRatio;
      } else {
        // Tall emote - constrain by height
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
  }, [selectedEmote.width, selectedEmote.height]);

  const emoteSize = getEmoteSize();
  const handleCopy = useCallback(
    (field: 'name' | 'url') => {
      void Clipboard.setStringAsync(
        field === 'name' ? selectedEmote.content : displayUrl,
      ).then(() =>
        toast.success(
          `${field === 'name' ? 'Emote name' : 'Emote URL'} copied`,
        ),
      );
    },
    [displayUrl, selectedEmote.content],
  );

  const actions = useMemo(
    () => [
      {
        icon: 'copy',
        label: 'Copy emote name',
        onPress: () => handleCopy('name'),
      },
      {
        icon: 'copy',
        label: 'Copy emote URL',
        onPress: () => handleCopy('url'),
      },
      {
        icon: 'external-link',
        label: 'Open in Browser',
        onPress: () => openLinkInBrowser(selectedEmote.emote_link as string),
      },
    ],
    [handleCopy, selectedEmote.emote_link],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.emoteContainer}>
            <Image
              source={displayUrl}
              contentFit="contain"
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
                <Icon icon={action.icon} color="#fff" size={18} />
                <Text style={styles.actionText}>{action.label}</Text>
              </View>
            </Button>
          ))}
        </View>
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.bgAlt,
    flex: 1,
    paddingBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing['2xl'],
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: theme.spacing['3xl'],
    paddingTop: theme.spacing.lg,
  },
  emoteContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.bg,
    borderColor: theme.colors.gray.border,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: theme.spacing.xl,
    minHeight: MAX_EMOTE_SIZE + theme.spacing.lg * 2,
    minWidth: MAX_EMOTE_SIZE + theme.spacing.lg * 2,
    padding: theme.spacing.lg,
  },
  emoteImage: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
  },
  emoteInfo: {
    flex: 1,
    justifyContent: 'center',
    minHeight: MAX_EMOTE_SIZE + theme.spacing.lg * 2,
  },
  emoteName: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  metadataContainer: {
    gap: theme.spacing.xs,
  },
  emoteMetadata: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.sm,
    lineHeight: theme.font.fontSize.sm * 1.3,
  },
  actionsContainer: {
    gap: theme.spacing.sm,
  },
  actionButton: {
    backgroundColor: theme.colors.gray.bg,
    borderColor: theme.colors.gray.border,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  actionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'flex-start',
  },
  actionText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.md,
    fontWeight: 'normal',
  },
  // Legacy styles for compatibility with BadgePreviewSheet
  meta: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'flex-start',
  },
  actions: {
    marginTop: theme.spacing.xl,
  },
  actionsList: {
    flex: 1,
  },
  wrapper: {
    paddingVertical: theme.spacing.md,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emoteDetail: {
    marginBottom: theme.spacing.xs / 2,
  },
  contentContainer: {
    overflow: 'visible',
    paddingHorizontal: theme.spacing.xl,
  },
});
