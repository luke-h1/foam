import { SanitisedBadgeSet } from '@app/services';
import {
  calculateAspectRatio,
  openLinkInBrowser,
  ParsedPart,
} from '@app/utils';
import { BottomSheetSectionList } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';
import { BrandIcon } from '../../BrandIcon';
import { Button } from '../../Button';
import { Icon } from '../../Icon';
import { Image } from '../../Image';
import { Typography } from '../../Typography';

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
  selectedEmote: ParsedPart | null;
  selectedBadge: SanitisedBadgeSet | null;
}

export function EmoteBadgePreview({
  selectedEmote,
  selectedBadge,
}: EmotePreviewProps) {
  const { styles, theme } = useStyles(stylesheet);

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
      keyExtractor={(item, index) => item.title + index}
      renderSectionHeader={({ section }) => {
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
                    style={{
                      width: width - 50,
                      height: height - 50,
                    }}
                  />
                </View>
                <View style={styles.metadataContainer}>
                  <View style={styles.metadataRow}>
                    <Typography
                      style={styles.metadataValue}
                      size="lg"
                      weight="bold"
                    >
                      {selectedEmote.original_name}
                    </Typography>
                  </View>
                  <View style={styles.metadataRow}>
                    <Typography style={styles.metadataValue}>
                      {selectedEmote.site}
                    </Typography>
                    {selectedEmote.site?.includes('7tv') && (
                      <BrandIcon name="stv" size="md" />
                    )}
                  </View>
                  {selectedEmote.creator && (
                    <View style={styles.metadataRow}>
                      <Typography style={styles.metadataValue}>
                        Created by: {selectedEmote.creator}
                      </Typography>
                    </View>
                  )}
                  {selectedEmote.original_name && (
                    <View style={styles.metadataRow}>
                      <Typography style={styles.metadataLabel}>
                        Original Name:
                      </Typography>
                      <Typography style={styles.metadataValue}>
                        {selectedEmote.original_name}
                      </Typography>
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
                    style={{
                      width: 50,
                      height: 50,
                    }}
                  />
                </View>
                <View style={styles.metadataContainer}>
                  <View style={styles.metadataRow}>
                    <Typography
                      style={styles.metadataValue}
                      size="lg"
                      weight="bold"
                    >
                      {selectedBadge.title}
                    </Typography>
                  </View>
                  <View style={styles.metadataRow}>
                    <Typography style={styles.metadataValue}>
                      {selectedBadge.type}
                    </Typography>
                  </View>
                  {selectedBadge.owner_username && (
                    <View style={styles.metadataRow}>
                      <Typography style={styles.metadataValue}>
                        Owner: {selectedBadge.owner_username}
                      </Typography>
                    </View>
                  )}
                  <View style={styles.metadataRow}>
                    <Typography style={styles.metadataLabel}>Set:</Typography>
                    <Typography style={styles.metadataValue}>
                      {selectedBadge.set}
                    </Typography>
                  </View>
                </View>
              </View>
            );
          }
        }
        return null;
      }}
      renderItem={({ item, index }) => (
        <Button
          key={index}
          style={[styles.actionButton, index > 0 && styles.actionButtonGap]}
          onPress={item.onPress}
        >
          <Icon icon={item.icon} />
          <Typography style={styles.actionText}>{item.title}</Typography>
        </Button>
      )}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.borderFaint,
      }}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const stylesheet = createStyleSheet(theme => ({
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
}));
