import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import * as Clipboard from 'expo-clipboard';
import { useCallback } from 'react';
import { Modal, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { toast } from 'sonner-native';
import { styles } from '../EmotePreviewSheet/EmotePreviewSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedBadge: SanitisedBadgeSet;
}

export function BadgePreviewSheet(props: Props) {
  const { visible, onClose, selectedBadge } = props;

  const handleCopy = useCallback(
    (field: 'name' | 'url') => {
      void Clipboard.setStringAsync(
        field === 'name' ? selectedBadge.title : selectedBadge.url,
      ).then(() => toast.success(`${field} Copied to clipboard`));
    },
    [selectedBadge.title, selectedBadge.url],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        <View style={styles.meta}>
          <Image
            useNitro
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
          <Button onPress={() => handleCopy('url')} style={styles.actionButton}>
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
      </View>
    </Modal>
  );
}

const badgetyles = StyleSheet.create({
  badge: {
    height: 50,
    width: 50,
  },
});
