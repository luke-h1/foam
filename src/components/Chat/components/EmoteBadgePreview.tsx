import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { BottomSheetSectionList } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { View, SectionListRenderItem } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';
import { BrandIcon } from '../../BrandIcon';
import { Button } from '../../Button';
import { Icon } from '../../Icon';
import { Image } from '../../Image';
import { Text } from '../../Text';

interface EmoteAction {
  title: string;
  icon: 'link' | 'copy' | 'external-link';
  onPress: () => void;
}

interface EmotePreviewSection {
  title: string;
  data: EmoteAction[];
}

interface EmotePreviewProps {
  selectedEmote: ParsedPart<'emote'> | null;
  selectedBadge: SanitisedBadgeSet | null;
}

export function EmoteBadgePreview({
  selectedEmote,
  selectedBadge,
}: EmotePreviewProps) {
  const { theme } = useUnistyles();

  // Properly typed render functions
  const renderItem: SectionListRenderItem<EmoteAction, EmotePreviewSection> = ({
    item,
    index,
  }) => (
    <Button
      key={index}
      style={[styles.actionButton, index > 0 && styles.actionButtonGap]}
      onPress={item.onPress}
    >
      <Icon icon={item.icon} />
      <Text style={styles.actionText}>{item.title}</Text>
    </Button>
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: EmotePreviewSection;
  }) => {
    if (section.title === 'preview') {
      if (selectedEmote) {
        const { height, width } = calculateAspectRatio(
          selectedEmote.width || 20,
          selectedEmote.height || 20,
          100,
        );
        return (
          <View style={styles.previewContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={selectedEmote.url ?? ''}
                transition={50}
                style={styles.emoteImage(width - 50, height - 50)}
              />
            </View>
            <View style={styles.metadataContainer}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataValue}>
                  {selectedEmote.original_name}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataValue}>{selectedEmote.site}</Text>
                {selectedEmote.site?.includes('7tv') && (
                  <BrandIcon name="stv" size="md" />
                )}
              </View>
              {selectedEmote.creator && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataValue}>
                    Created by: {selectedEmote.creator}
                  </Text>
                </View>
              )}
              {selectedEmote.original_name && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Original Name:</Text>
                  <Text style={styles.metadataValue}>
                    {selectedEmote.original_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      }
      if (selectedBadge) {
        return (
          <View style={styles.previewContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={selectedBadge.url}
                transition={50}
                style={styles.badgeImage}
              />
            </View>
            <View style={styles.metadataContainer}>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataValue}>{selectedBadge.title}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataValue}>{selectedBadge.type}</Text>
              </View>
              {selectedBadge.owner_username && (
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataValue}>
                    Owner: {selectedBadge.owner_username}
                  </Text>
                </View>
              )}
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Set:</Text>
                <Text style={styles.metadataValue}>{selectedBadge.set}</Text>
              </View>
            </View>
          </View>
        );
      }
    }
    return null;
  };

  const handleCopyName = () => {
    if (selectedEmote?.content) {
      void Clipboard.setStringAsync(selectedEmote.content).then(() => {
        toast.success('Emote name copied to clipboard');
      });
    } else if (selectedBadge?.title) {
      void Clipboard.setStringAsync(selectedBadge.title).then(() => {
        toast.success('Badge name copied to clipboard');
      });
    }
  };

  const handleCopyUrl = () => {
    if (selectedEmote?.url) {
      void Clipboard.setStringAsync(selectedEmote.url).then(() => {
        toast.success('Emote URL copied to clipboard');
      });
    } else if (selectedBadge?.url) {
      void Clipboard.setStringAsync(selectedBadge.url).then(() => {
        toast.success('Badge URL copied to clipboard');
      });
    }
  };

  const getPreviewActions = (type: 'emote' | 'badge') => [
    {
      title: 'Copy Name',
      icon: 'copy' as const,
      onPress: handleCopyName,
    },
    {
      title: 'Copy URL',
      icon: 'copy' as const,
      onPress: handleCopyUrl,
    },
    {
      title: 'Open in Browser',
      icon: 'external-link' as const,
      onPress: () =>
        openLinkInBrowser(
          type === 'emote'
            ? (selectedEmote?.emote_link ?? '')
            : (selectedBadge?.url ?? ''),
        ),
    },
  ];

  const previews: EmotePreviewSection[] = (() => {
    if (selectedEmote) {
      return [{ title: 'preview', data: getPreviewActions('emote') }];
    }
    if (selectedBadge) {
      return [{ title: 'preview', data: getPreviewActions('badge') }];
    }
    return [];
  })();

  if (previews.length === 0) {
    return null;
  }

  return (
    <BottomSheetSectionList
      sections={previews}
      keyExtractor={(item: EmoteAction, index: number) =>
        `${item.title}-${index}`
      }
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.md,
        // backgroundColor: theme.colors.borderFaint,
      }}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create(theme => ({
  previewContainer: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: -theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  metadataContainer: {
    width: '100%',
    alignItems: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadataLabel: {
    marginRight: theme.spacing.sm,
  },
  metadataValue: {
    textAlign: 'center',
  },
  actionsContainer: {
    justifyContent: 'space-around',
    borderRadius: theme.radii.md,
    paddingTop: theme.spacing.md,
    borderCurve: 'continuous',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  actionButtonGap: {
    marginTop: theme.spacing.md,
  },
  actionText: {
    marginLeft: theme.spacing.xs,
  },
  emoteImage: (width: number, height: number) => ({
    width,
    height,
  }),
  badgeImage: {
    width: 50,
    height: 50,
  },
}));
