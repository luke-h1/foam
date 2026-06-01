/* eslint-disable react-native/sort-styles */
import { Button } from '@app/components/Button/Button';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import * as Clipboard from 'expo-clipboard';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { toast } from 'sonner-native';
import { CHAT_SHEET_BACKGROUND, chatSheetSurface } from '../chatSheetSurface';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedBadge: SanitisedBadgeSet;
}

type MetadataRow = {
  label: string;
  value?: string;
};

type PreviewAction = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  subtitle: string;
};

export function BadgePreviewSheet(props: Props) {
  const { visible, onClose, selectedBadge } = props;
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(screenWidth - theme.space16 * 2, 520),
  );
  const scrollStyle = useMemo(
    () => [styles.scroll, { maxHeight: Math.round(screenHeight * 0.58) }],
    [screenHeight],
  );
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        maxHeight: Math.round(screenHeight * 0.82),
        width: sheetWidth,
      },
    ],
    [screenHeight, sheetWidth],
  );

  const handleCopy = useCallback(
    (field: 'name' | 'url') => {
      void Clipboard.setStringAsync(
        field === 'name' ? selectedBadge.title : selectedBadge.url,
      ).then(() =>
        toast.success(
          field === 'name' ? 'Badge name copied' : 'Badge URL copied',
        ),
      );
    },
    [selectedBadge.title, selectedBadge.url],
  );

  const metadataRows = useMemo<MetadataRow[]>(
    () =>
      [
        { label: 'Type', value: selectedBadge.type },
        { label: 'Provider', value: selectedBadge.provider?.toUpperCase() },
        { label: 'Owner', value: selectedBadge.owner_username },
        { label: 'Set', value: selectedBadge.set },
        { label: 'ID', value: selectedBadge.id },
      ].filter(row => Boolean(row.value)),
    [
      selectedBadge.id,
      selectedBadge.owner_username,
      selectedBadge.provider,
      selectedBadge.set,
      selectedBadge.type,
    ],
  );

  const actions = useMemo<PreviewAction[]>(() => {
    const items: PreviewAction[] = [
      {
        icon: 'doc.on.doc',
        label: 'Copy Badge name',
        onPress: () => handleCopy('name'),
        subtitle: selectedBadge.title,
      },
      {
        icon: 'link',
        label: 'Copy Badge URL',
        onPress: () => handleCopy('url'),
        subtitle: 'Rendered badge source',
      },
    ];

    if (selectedBadge.url) {
      items.push({
        icon: 'arrow.up.right.square',
        label: 'Open in Browser',
        onPress: () => openLinkInBrowser(selectedBadge.url),
        subtitle: 'Image source',
      });
    }

    return items;
  }, [handleCopy, selectedBadge.title, selectedBadge.url]);

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      testID="badge-preview-sheet"
    >
      <View style={containerStyle}>
        <View style={styles.topBar}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow} weight="semibold">
              Badge preview
            </Text>
            <Text style={styles.title} weight="semibold" numberOfLines={2}>
              {selectedBadge.title}
            </Text>
          </View>
          <Button label="Done" style={styles.doneButton} onPress={onClose}>
            <SymbolView
              name="checkmark"
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
                trackLoadContext="chat.badge-preview"
                source={selectedBadge.url}
                cacheVariant="badge"
                transition={50}
                style={styles.badgeImage}
                contentFit="contain"
              />
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText} weight="semibold">
                {selectedBadge.type}
              </Text>
            </View>
          </View>

          <View style={styles.metadataCard}>
            {metadataRows.map(row => (
              <View key={row.label} style={styles.metadataRow}>
                <Text style={styles.metadataLabel} weight="semibold">
                  {row.label}
                </Text>
                <Text style={styles.metadataValue} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

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
                    tintColor={theme.colorGreen}
                    size={18}
                  />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionText} weight="semibold">
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
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.18)',
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
  badgeImage: {
    height: 60,
    width: 60,
  },
  container: {
    ...chatSheetSurface,
    backgroundColor: CHAT_SHEET_BACKGROUND,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    paddingBottom: theme.space16,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
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
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: 128,
    justifyContent: 'center',
    width: '100%',
  },
  metadataCard: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.085)',
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
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    gap: theme.space12,
    padding: theme.space12,
  },
  previewPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colorAccentSurface,
    borderColor: 'rgba(74, 222, 128, 0.22)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
    paddingVertical: 5,
  },
  previewPillText: {
    color: theme.colorGreen,
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
