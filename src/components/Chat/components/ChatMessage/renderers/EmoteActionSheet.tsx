import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import {
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  cloneElement,
  isValidElement,
  ReactElement,
} from 'react';
import { type GestureResponderEvent } from 'react-native';
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
  const sheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['25%'], []);

  const openSheet = useCallback((e: GestureResponderEvent) => {
    e?.preventDefault?.();
    sheetRef.current?.present();
  }, []);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
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
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        style={styles.contentContainer}
        backgroundStyle={styles.background}
      >
        <BottomSheetView style={styles.wrapper}>
          <Button onPress={copyName} style={styles.actionButton}>
            <Icon icon="copy" color="#fff" size={16} />
            <Text style={styles.actionText}>Copy name</Text>
          </Button>
          {part.url ? (
            <Button onPress={copyImageUrl} style={styles.actionButton}>
              <Icon icon="copy" color="#fff" size={16} />
              <Text style={styles.actionText}>Copy image URL</Text>
            </Button>
          ) : null}
          {onPress ? (
            <Button onPress={handlePreview} style={styles.actionButton}>
              <Icon icon="external-link" color="#fff" size={16} />
              <Text style={styles.actionText}>Preview</Text>
            </Button>
          ) : null}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create(theme => ({
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  background: {},
  wrapper: {
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  actionText: {
    color: theme.colors.gray.text,
  },
}));
