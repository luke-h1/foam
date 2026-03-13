import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { forwardRef, useCallback, useMemo, type ComponentProps } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

interface Props {
  message: ParsedPart[];
  username?: string;
  handleReply: () => void;
  handleCopy: () => void;
}

export const ActionSheet = forwardRef<BottomSheetModal, Props>((props, ref) => {
  const { message, username, handleReply, handleCopy } = props;
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ['40%'], []);

  const renderBackdrop = useCallback(
    (backdropProps: ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const actions = useMemo(
    () => [
      {
        id: 'copy' as const,
        icon: 'copy',
        label: 'Copy Message',
        onPress: handleCopy,
      },
      {
        id: 'reply' as const,
        icon: 'arrowshape.turn.up.left',
        label: 'Reply',
        onPress: handleReply,
      },
      {
        id: 'report' as const,
        icon: 'arrow.up.right.square',
        label: 'Report message',
        onPress: () => {},
      },
    ],
    [handleCopy, handleReply],
  );

  const getSFSymbolName = useCallback(
    (actionId: 'copy' | 'reply' | 'report') => {
      switch (actionId) {
        case 'copy':
          return 'doc.on.doc' as const;
        case 'reply':
          return 'arrowshape.turn.up.left' as const;
        case 'report':
          return 'arrow.up.right.square' as const;
        default:
          return 'questionmark.circle' as const;
      }
    },
    [],
  );

  const renderMessagePart = useCallback((part: ParsedPart, index: number) => {
    switch (part.type) {
      case 'emote':
        if (!part.url) return null;
        return (
          <Image
            key={`${part.type}-${part.id ?? index}-${index}`}
            useNitro
            source={part.url}
            style={styles.messageEmote}
            contentFit="contain"
            transition={0}
          />
        );
      case 'mention':
      case 'text':
        return (
          <Text key={`${part.type}-${index}`} style={styles.messageText}>
            {part.content}
          </Text>
        );
      default:
        if ('content' in part && typeof part.content === 'string') {
          return (
            <Text key={`${part.type}-${index}`} style={styles.messageText}>
              {part.content}
            </Text>
          );
        }
        return null;
    }
  }, []);

  return (
    <BottomSheetModal
      ref={ref}
      detached
      enableDynamicSizing
      maxDynamicContentSize={460}
      backdropComponent={renderBackdrop}
      bottomInset={Math.max(insets.bottom + 8, 16)}
      style={styles.modalContainer}
      backgroundStyle={styles.bottomSheet}
      handleIndicatorStyle={styles.handle}
      enablePanDownToClose
      snapPoints={snapPoints}
    >
      <BottomSheetView style={styles.wrapper}>
        <View style={styles.previewCard}>
          <View style={styles.messageLine}>
            {username ? (
              <Text style={styles.usernameText}>{username}: </Text>
            ) : null}
            {message.map(renderMessagePart)}
          </View>
        </View>

        <View style={styles.actionGroup}>
          {actions.map(action => (
            <Button
              key={action.label}
              onPress={action.onPress}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                {Platform.OS === 'ios' ? (
                  <SymbolView
                    name={getSFSymbolName(action.id)}
                    size={18}
                    tintColor="#b7bdc9"
                    weight="regular"
                    style={styles.actionIcon}
                  />
                ) : (
                  <Icon icon={action.icon} color="#b7bdc9" size={18} />
                )}
                <Text style={styles.actionText}>{action.label}</Text>
              </View>
            </Button>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create(theme => ({
  modalContainer: {
    marginHorizontal: theme.spacing.md,
  },
  bottomSheet: {
    backgroundColor: '#171b23',
    borderRadius: 28,
  },
  handle: {
    backgroundColor: theme.colors.gray.accent,
    width: 42,
    height: 5.5,
    borderRadius: theme.radii.full,
    marginTop: 2,
  },
  wrapper: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    backgroundColor: '#171b23',
    gap: theme.spacing.lg,
  },
  previewCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  messageLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  usernameText: {
    color: theme.colors.gray.text,
    fontWeight: '600',
    fontSize: theme.font.fontSize.lg,
  },
  messageText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.lg,
    lineHeight: theme.font.fontSize.lg * 1.25,
  },
  messageEmote: {
    width: 24,
    height: 24,
    marginHorizontal: 2,
  },
  actionGroup: {
    borderRadius: theme.radii.xl,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  actionButton: {
    minHeight: Platform.select({ ios: 56, android: 56 }),
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.md,
    fontWeight: Platform.select({ ios: '400', android: '400' }),
  },
}));

ActionSheet.displayName = 'ActionSheet';
