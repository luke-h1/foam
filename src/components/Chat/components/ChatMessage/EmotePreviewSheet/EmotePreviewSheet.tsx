import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Image } from '@app/components/Image';
import { Typography } from '@app/components/Typography';
import {
  calculateAspectRatio,
  openLinkInBrowser,
  ParsedPart,
} from '@app/utils';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { forwardRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';

interface Props {
  selectedEmote: ParsedPart<'emote'>;
}

export const EmotePreviewSheet = forwardRef<BottomSheetModal, Props>(
  (props, ref) => {
    const { selectedEmote } = props;
    const { styles } = useStyles(emoteStylesheet);

    const { height, width } = calculateAspectRatio(
      selectedEmote.width || 20,
      selectedEmote.height || 20,
      100,
    );

    const snapPoints = useMemo(() => ['25%', '50%', '60%'], []);

    const handleCopy = useCallback((field: 'name' | 'url') => {
      void Clipboard.setStringAsync(
        field === 'name'
          ? selectedEmote.content
          : (selectedEmote.url as string),
      ).then(() => toast.success(`${field} Copied to clipboard`));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <BottomSheetModal
        ref={ref}
        style={styles.contentContainer}
        backgroundStyle={styles.bottomSheet}
        enablePanDownToClose
        snapPoints={snapPoints}
      >
        <BottomSheetView style={styles.wrapper}>
          <View style={styles.meta}>
            <Image
              source={selectedEmote.url ?? ''}
              transition={50}
              style={{
                width: width - 25,
                height: height - 25,
              }}
            />
            <View style={styles.emoteInfo}>
              <Typography weight="bold" size="lg" style={styles.emoteName}>
                {selectedEmote?.name}
              </Typography>
              <Typography weight="thin" size="xs" style={styles.emoteDetail}>
                {selectedEmote.site}
              </Typography>
              {selectedEmote.creator && (
                <Typography weight="thin" size="xs" style={styles.emoteDetail}>
                  By {selectedEmote.creator}
                </Typography>
              )}
              <Typography weight="thin" size="xs" style={styles.emoteDetail}>
                Original Name: {selectedEmote.original_name}
              </Typography>
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              onPress={() => handleCopy('name')}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <Icon icon="copy" color="#fff" size={16} />
                <Typography style={styles.actionText}>
                  Copy emote name
                </Typography>
              </View>
            </Button>
            <Button
              onPress={() => handleCopy('url')}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <Icon icon="copy" color="#fff" size={16} />
                <Typography style={styles.actionText}>
                  Copy emote URL
                </Typography>
              </View>
            </Button>
            <Button
              onPress={() =>
                openLinkInBrowser(selectedEmote.emote_link as string)
              }
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <Icon icon="external-link" color="#fff" size={16} />
                <Typography style={styles.actionText}>
                  Open in Browser
                </Typography>
              </View>
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

EmotePreviewSheet.displayName = 'EmotePreviewSheet';

export const emoteStylesheet = createStyleSheet(theme => ({
  meta: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  actions: {
    marginTop: theme.spacing.xl,
  },
  actionsList: {
    flex: 1,
  },
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
    fontWeight: theme.font.fontWeight.thin,
    fontSize: theme.font.fontSize.sm,
  },
  emoteInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  emoteName: {
    marginBottom: theme.spacing.xs,
  },
  emoteDetail: {
    marginBottom: theme.spacing.xs / 2,
  },
  contentContainer: {
    paddingHorizontal: 16,
    overflow: 'visible',
  },
  wrapper: {
    paddingVertical: theme.spacing.md,
  },
  imageContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  bottomSheet: {
    backgroundColor: theme.colors.borderNeutral,
  },
}));
