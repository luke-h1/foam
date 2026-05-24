import { Button } from '@app/components/Button/Button';
import { SymbolView } from 'expo-symbols';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import * as Clipboard from 'expo-clipboard';
import { useCallback } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
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
            trackLoadTime
            trackLoadContext="chat.badge-preview"
            source={selectedBadge.url ?? ''}
            cacheVariant="badge"
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
          <Button onPress={onClose} style={styles.actionButton}>
            <View style={styles.actionContent}>
              <SymbolView name="checkmark" tintColor="#fff" size={16} />
              <Text style={styles.actionText}>Done</Text>
            </View>
          </Button>
          <Button
            onPress={() => handleCopy('name')}
            style={styles.actionButton}
          >
            <View style={styles.actionContent}>
              <SymbolView name="doc.on.doc" tintColor="#fff" size={16} />
              <Text style={styles.actionText}>Copy Badge name</Text>
            </View>
          </Button>
          <Button onPress={() => handleCopy('url')} style={styles.actionButton}>
            <View style={styles.actionContent}>
              <SymbolView name="doc.on.doc" tintColor="#fff" size={16} />
              <Text style={styles.actionText}>Copy Badge URL</Text>
            </View>
          </Button>
          <Button
            onPress={() => openLinkInBrowser(selectedBadge.url)}
            style={styles.actionButton}
          >
            <View style={styles.actionContent}>
              <SymbolView
                name="arrow.up.right.square"
                tintColor="#fff"
                size={16}
              />
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
