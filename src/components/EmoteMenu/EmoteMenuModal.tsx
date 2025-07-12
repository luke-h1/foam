import { Button, Typography } from '@app/components';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { useRecentEmotes } from '../../hooks/useRecentEmotes';
import { SanitisiedEmoteSet } from '../../services/seventTvService';
import { EmoteMenu } from './EmoteMenu';

interface EmoteMenuModalProps {
  onEmoteSelect: (emote: SanitisiedEmoteSet) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const EmoteMenuModal: React.FC<EmoteMenuModalProps> = ({
  onEmoteSelect,
  isVisible,
  onClose,
}) => {
  const { styles } = useStyles(stylesheet);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { recentEmotes, addRecentEmote } = useRecentEmotes();

  const handleEmotePress = useCallback(
    (emote: SanitisiedEmoteSet) => {
      addRecentEmote(emote);
      onEmoteSelect(emote);
      onClose();
    },
    [addRecentEmote, onEmoteSelect, onClose],
  );

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [isVisible]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={['50%', '75%']}
      onDismiss={onClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Typography style={styles.title}>Emotes</Typography>
          <Button onPress={onClose} style={styles.closeButton}>
            <Typography style={styles.closeButtonText}>✕</Typography>
          </Button>
        </View>

        <EmoteMenu
          onEmotePress={handleEmotePress}
          recentEmotes={recentEmotes}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

 
const stylesheet = createStyleSheet(theme => ({
  bottomSheetBackground: {
    backgroundColor: theme.colors.border,
  },
  handleIndicator: {
    backgroundColor: theme.colors.border,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
}));
