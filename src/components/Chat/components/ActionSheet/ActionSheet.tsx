import { Typography } from '@app/components';
import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { ParsedPart, replaceEmotesWithText } from '@app/utils';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface Props {
  message: ParsedPart[];
  username?: string;
  handleReply: () => void;
  handleCopy: () => void;
}

export const ActionSheet = forwardRef<BottomSheetModal, Props>((props, ref) => {
  const { message, username, handleReply, handleCopy } = props;

  const snapPoints = useMemo(() => ['25%', '50%', '60%'], []);

  const messageText = useCallback(
    () => replaceEmotesWithText(message),
    [message],
  );

  return (
    <BottomSheetModal
      ref={ref}
      style={styles.contentContainer}
      backgroundStyle={styles.bottomSheet}
      enablePanDownToClose
      snapPoints={snapPoints}
    >
      <BottomSheetView style={styles.wrapper}>
        <View style={styles.info}>
          <Typography>
            {username} : {messageText()}
          </Typography>
        </View>

        <View style={styles.actions}>
          <Button onPress={handleCopy} style={styles.actionButton}>
            <View style={styles.actionContent}>
              <Icon icon="copy" color="#fff" size={16} />
              <Typography style={styles.actionText}>Copy Message</Typography>
            </View>
          </Button>
          <Button onPress={handleReply} style={styles.actionButton}>
            <View style={styles.actionContent}>
              <Icon icon="copy" color="#fff" size={16} />
              <Typography style={styles.actionText}>Reply</Typography>
            </View>
          </Button>
          <Button onPress={() => {}} style={styles.actionButton}>
            <View style={styles.actionContent}>
              <Icon icon="external-link" color="#fff" size={16} />
              <Typography style={styles.actionText}>Report message</Typography>
            </View>
          </Button>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create(theme => ({
  contentContainer: {
    paddingHorizontal: theme.spacing.xl,
    overflow: 'visible',
  },
  bottomSheet: {
    // backgroundColor: theme.colors.borderFaint,
  },
  wrapper: {
    paddingVertical: theme.spacing.md,
  },
  actions: { marginTop: theme.spacing.xl },
  actionButton: {
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionText: {
    // fontWeight: theme.font.fontWeight.thin,
    // fontSize: theme.font.fontSize.sm,
  },
  info: {},
}));

ActionSheet.displayName = 'ActionSheet';
