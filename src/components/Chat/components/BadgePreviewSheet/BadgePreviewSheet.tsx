import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Image } from '@app/components/Image';
import { Typography } from '@app/components/Typography';
import { SanitisedBadgeSet } from '@app/services';
import { openLinkInBrowser } from '@app/utils';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { forwardRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';
import { styles } from '../EmotePreviewSheet';

interface Props {
  selectedBadge: SanitisedBadgeSet;
}

export const BadgePreviewSheet = forwardRef<BottomSheetModal, Props>(
  (props, ref) => {
    const { selectedBadge } = props;

    const snapPoints = useMemo(() => ['25%', '50%', '60%'], []);

    const handleCopy = useCallback((field: 'name' | 'url') => {
      void Clipboard.setStringAsync(
        field === 'name' ? selectedBadge.title : selectedBadge.url,
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
              source={selectedBadge.url ?? ''}
              transition={50}
              style={{
                width: 50,
                height: 50,
              }}
            />
            <View style={styles.emoteInfo}>
              <Typography weight="bold" size="lg" style={styles.emoteName}>
                {selectedBadge.title}
              </Typography>
              <Typography weight="thin" size="sm" style={styles.emoteDetail}>
                {selectedBadge.type}
              </Typography>
              {selectedBadge.owner_username && (
                <Typography weight="thin" size="sm" style={styles.emoteDetail}>
                  By {selectedBadge.owner_username}
                </Typography>
              )}
              <Typography weight="thin" size="sm" style={styles.emoteDetail}>
                ID: {selectedBadge.id}
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
                  Copy Badge name
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
                  Copy Badge URL
                </Typography>
              </View>
            </Button>
            <Button
              onPress={() => openLinkInBrowser(selectedBadge.url)}
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

BadgePreviewSheet.displayName = 'BadgePreviewSheet';
