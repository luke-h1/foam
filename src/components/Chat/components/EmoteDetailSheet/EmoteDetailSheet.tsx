import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Dimensions,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';

interface Props {
  selectedEmote: ParsedPart<'emote'> | null;
  isVisible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const MAX_EMOTE_SIZE = Math.min(screenWidth * 0.25, 100);
const MIN_EMOTE_SIZE = 32;

export function EmoteDetailSheet({ selectedEmote, isVisible, onClose }: Props) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isVisible && selectedEmote) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, selectedEmote]);

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

  const snapPoints = useMemo(() => ['35%'], []);

  if (!selectedEmote) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      backgroundStyle={styles.bottomSheet as StyleProp<ViewStyle>}
      handleIndicatorStyle={styles.handle as StyleProp<ViewStyle>}
      enablePanDownToClose
      snapPoints={snapPoints}
      onDismiss={onClose}
    >
      <BottomSheetView
        style={[
          styles.container as StyleProp<ViewStyle>,
          { paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
      >
        <View style={styles.header as StyleProp<ViewStyle>}>
          <View style={styles.emoteContainer as StyleProp<ViewStyle>}>
            <Image
              source={selectedEmote.url ?? ''}
              transition={100}
              style={[styles.emoteImage as StyleProp<ImageStyle>, emoteSize]}
            />
          </View>

          <View style={styles.emoteInfo as StyleProp<ViewStyle>}>
            <Text
              style={styles.emoteName as StyleProp<TextStyle>}
              numberOfLines={2}
            >
              {selectedEmote?.name}
            </Text>

            <View style={styles.metadataContainer as StyleProp<ViewStyle>}>
              <Text
                style={styles.emoteMetadata as StyleProp<TextStyle>}
                numberOfLines={1}
              >
                {selectedEmote.site}
              </Text>
              {selectedEmote.creator && (
                <Text
                  style={styles.emoteMetadata as StyleProp<TextStyle>}
                  numberOfLines={1}
                >
                  By {selectedEmote.creator}
                </Text>
              )}
              {selectedEmote.original_name &&
                selectedEmote.original_name !== selectedEmote.name && (
                  <Text
                    style={styles.emoteMetadata as StyleProp<TextStyle>}
                    numberOfLines={1}
                  >
                    Original: {selectedEmote.original_name}
                  </Text>
                )}
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer as StyleProp<ViewStyle>}>
          {actions.map((action, index) => (
            <View key={index}>
              {index > 0 && (
                <View style={styles.separator as StyleProp<ViewStyle>} />
              )}
              <Button
                onPress={action.onPress}
                style={styles.actionButton as StyleProp<ViewStyle>}
              >
                <View style={styles.actionContent as StyleProp<ViewStyle>}>
                  <Icon
                    icon={action.icon}
                    color={theme.colors.gray.text}
                    size={20}
                  />
                  <Text
                    style={styles.actionText as StyleProp<TextStyle>}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </View>
              </Button>
            </View>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create(theme => ({
  bottomSheet: {
    backgroundColor: theme.colors.gray.bgAlt,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    borderCurve: 'continuous',
  },
  handle: {
    backgroundColor: theme.colors.gray.accent,
    width: 36,
    height: 5,
    borderRadius: theme.radii.full,
    opacity: 0.4,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing['2xl'],
    paddingTop: theme.spacing.md,
  },
  emoteContainer: {
    backgroundColor: theme.colors.gray.bg,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.xl,
    marginRight: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  emoteImage: {
    borderRadius: theme.radii.sm,
  },
  emoteInfo: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: 100,
    minWidth: 0,
  },
  emoteName: {
    fontSize: theme.font.fontSize.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.gray.text,
    marginBottom: theme.spacing.md,
    lineHeight: theme.font.fontSize.lg * 1.2,
    flexShrink: 1,
  },
  metadataContainer: {
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
  emoteMetadata: {
    fontSize: theme.font.fontSize.sm,
    color: theme.colors.gray.textLow,
    lineHeight: theme.font.fontSize.sm * 1.4,
    flexShrink: 1,
  },
  actionsContainer: {
    backgroundColor: theme.colors.gray.bg,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.gray.border,
    marginLeft: theme.spacing.xl,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
    borderWidth: 0,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.lg,
    flexShrink: 1,
    minWidth: 0,
  },
  actionText: {
    fontSize: theme.font.fontSize.md,
    color: theme.colors.gray.text,
    fontWeight: 'normal' as const,
    flexShrink: 1,
  },
}));
