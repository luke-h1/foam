import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Image } from '@app/components/Image';
import { Text } from '@app/components/Text';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { forwardRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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
              style={badgetyles.badge}
            />
            <View style={styles.emoteInfo}>
              <Text style={styles.emoteName}>{selectedBadge.title}</Text>
              <Text style={styles.emoteDetail}>{selectedBadge.type}</Text>
              {selectedBadge.owner_username && (
                <Text style={styles.emoteDetail}>
                  By {selectedBadge.owner_username}
                </Text>
              )}
              <Text style={styles.emoteDetail}>ID: {selectedBadge.id}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              onPress={() => handleCopy('name')}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <Icon icon="copy" color="#fff" size={16} />
                <Text style={styles.actionText}>Copy Badge name</Text>
              </View>
            </Button>
            <Button
              onPress={() => handleCopy('url')}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <Icon icon="copy" color="#fff" size={16} />
                <Text style={styles.actionText}>Copy Badge URL</Text>
              </View>
            </Button>
            <Button
              onPress={() => openLinkInBrowser(selectedBadge.url)}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                <Icon icon="external-link" color="#fff" size={16} />
                <Text style={styles.actionText}>Open in Browser</Text>
              </View>
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const badgetyles = StyleSheet.create({
  badge: {
    height: 50,
    width: 50,
  },
});

BadgePreviewSheet.displayName = 'BadgePreviewSheet';
