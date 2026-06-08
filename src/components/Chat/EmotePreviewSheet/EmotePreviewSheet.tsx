import { memo } from 'react';
import { Button } from '@app/components/Button/Button';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { getEmoteDisplayName } from '@app/utils/emote/getEmoteDisplayName';
import * as Clipboard from 'expo-clipboard';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { toast } from 'sonner-native';

interface Props {
  disableAnimations?: boolean;
  visible: boolean;
  onClose: () => void;
  selectedEmote: ParsedPart<'emote'>;
}

type PreviewAction = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  subtitle: string;
};

const MIN_EMOTE_SIZE = 36;

function EmotePreviewSheetComponent(props: Props) {
  const { visible, onClose, selectedEmote, disableAnimations = false } = props;
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(screenWidth - theme.space16 * 2, 520),
  );

  const displayUrl = getDisplayEmoteUrl({
    url: selectedEmote.url,
    static_url: selectedEmote.static_url,
    disableAnimations,
  });

  const emoteName = getEmoteDisplayName(selectedEmote);
  const emoteLink =
    typeof selectedEmote.emote_link === 'string'
      ? selectedEmote.emote_link
      : undefined;

  const maxEmoteSize = Math.min(Math.max(screenWidth * 0.36, 96), 156);

  const scrollStyle = [
    styles.scroll,
    { maxHeight: Math.round(screenHeight * 0.58) },
  ];

  const containerStyle = [
    styles.container,
    {
      maxHeight: Math.round(screenHeight * 0.82),
      width: sheetWidth,
    },
  ];

  const emoteSize = (() => {
    const originalWidth = selectedEmote.width || 28;
    const originalHeight = selectedEmote.height || 28;
    const aspectRatio = originalWidth / originalHeight;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (targetWidth > maxEmoteSize || targetHeight > maxEmoteSize) {
      if (aspectRatio > 1) {
        targetWidth = maxEmoteSize;
        targetHeight = maxEmoteSize / aspectRatio;
      } else {
        targetHeight = maxEmoteSize;
        targetWidth = maxEmoteSize * aspectRatio;
      }
    }

    if (targetWidth < MIN_EMOTE_SIZE && targetHeight < MIN_EMOTE_SIZE) {
      if (aspectRatio > 1) {
        targetWidth = MIN_EMOTE_SIZE;
        targetHeight = MIN_EMOTE_SIZE / aspectRatio;
      } else {
        targetHeight = MIN_EMOTE_SIZE;
        targetWidth = MIN_EMOTE_SIZE * aspectRatio;
      }
    }

    return {
      height: Math.round(targetHeight),
      width: Math.round(targetWidth),
    };
  })();

  const handleCopy = (field: 'name' | 'url') => {
    void Clipboard.setStringAsync(
      field === 'name' ? emoteName : displayUrl,
    ).then(() =>
      toast.success(
        field === 'name' ? 'Emote name copied' : 'Emote URL copied',
      ),
    );
  };

  const metadataRows = [
    { label: 'Provider', value: selectedEmote.site },
    { label: 'Creator', value: selectedEmote.creator },
    {
      label: 'Original',
      value:
        selectedEmote.original_name && selectedEmote.original_name !== emoteName
          ? selectedEmote.original_name
          : undefined,
    },
  ].filter(row => Boolean(row.value));

  const actions: PreviewAction[] = (() => {
    const items: PreviewAction[] = [
      {
        icon: 'doc.on.doc',
        label: 'Copy emote name',
        onPress: () => handleCopy('name'),
        subtitle: emoteName,
      },
      {
        icon: 'link',
        label: 'Copy emote URL',
        onPress: () => handleCopy('url'),
        subtitle: 'Rendered image source',
      },
    ];

    if (emoteLink) {
      items.push({
        icon: 'arrow.up.right.square',
        label: 'Open in Browser',
        onPress: async () => {
          await openLinkInBrowser(emoteLink);
        },
        subtitle: 'Source page',
      });
    }

    return items;
  })();

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      testID='emote-preview-sheet'
    >
      <View style={containerStyle}>
        <View style={styles.topBar}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow} weight='semibold'>
              Emote preview
            </Text>
            <Text style={styles.title} weight='semibold' numberOfLines={2}>
              {emoteName}
            </Text>
          </View>
          <Button label='Done' style={styles.doneButton} onPress={onClose}>
            <SymbolView
              name='checkmark'
              size={18}
              tintColor={theme.color.text.dark}
            />
          </Button>
        </View>

        <ScrollView
          style={scrollStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewPanel}>
            <View style={styles.imageStage}>
              <Image
                useNitro
                trackLoadTime
                trackLoadContext='chat.emote-preview'
                source={displayUrl}
                cacheVariant='emote'
                contentFit='contain'
                style={[styles.emoteImage, emoteSize]}
              />
            </View>
            {selectedEmote.site ? (
              <View style={styles.previewPill}>
                <Text style={styles.previewPillText} weight='semibold'>
                  {selectedEmote.site}
                </Text>
              </View>
            ) : null}
          </View>

          {metadataRows.length > 0 ? (
            <View style={styles.metadataCard}>
              {metadataRows.map(row => (
                <View key={row.label} style={styles.metadataRow}>
                  <Text style={styles.metadataLabel} weight='semibold'>
                    {row.label}
                  </Text>
                  <Text style={styles.metadataValue} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actionGroup}>
            {actions.map((action, index) => (
              <Button
                key={action.label}
                onPress={action.onPress}
                style={[
                  styles.actionButton,
                  index < actions.length - 1 && styles.actionButtonBorder,
                ]}
              >
                <View style={styles.actionIconFrame}>
                  <SymbolView
                    name={action.icon}
                    tintColor={theme.colorPrimary}
                    size={18}
                  />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionText} weight='semibold'>
                    {action.label}
                  </Text>
                  <Text style={styles.actionSubtitle} numberOfLines={1}>
                    {action.subtitle}
                  </Text>
                </View>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const EmotePreviewSheet = memo(EmotePreviewSheetComponent);

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 52,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomColor: 'rgba(255,255,255,0.075)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionGroup: {
    backgroundColor: '#19191c',
    borderColor: 'rgba(255,255,255,0.065)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(26, 201, 162, 0.12)',
    borderColor: 'rgba(26, 201, 162, 0.18)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  actionSubtitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    lineHeight: theme.fontSize11 * 1.25,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.25,
  },
  container: {
    paddingBottom: theme.space24,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: '#1f2024',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  emoteImage: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
  },
  eyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heading: {
    flex: 1,
    paddingRight: theme.space12,
  },
  imageStage: {
    alignItems: 'center',
    backgroundColor: '#19191c',
    borderColor: 'rgba(255,255,255,0.065)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: 152,
    justifyContent: 'center',
    width: '100%',
  },
  metadataCard: {
    backgroundColor: '#19191c',
    borderColor: 'rgba(255,255,255,0.065)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    padding: theme.space12,
  },
  metadataLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    minWidth: 68,
    textTransform: 'uppercase',
  },
  metadataRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    paddingVertical: theme.space8,
  },
  metadataValue: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 13,
    lineHeight: theme.fontSize14 * 1.2,
  },
  previewPanel: {
    gap: theme.space12,
    paddingVertical: theme.space4,
  },
  previewPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colorAccentSurface,
    borderColor: 'rgba(26, 201, 162, 0.22)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
    paddingVertical: 5,
  },
  previewPillText: {
    color: theme.colorPrimary,
    fontSize: theme.fontSize11,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: theme.space12,
    paddingBottom: theme.space16,
  },
  title: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize18,
    lineHeight: theme.fontSize18 * 1.2,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'space-between',
    paddingBottom: theme.space12,
  },
});
