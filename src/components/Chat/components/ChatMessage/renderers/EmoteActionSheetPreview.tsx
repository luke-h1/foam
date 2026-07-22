import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export function EmoteActionSheetPreview({
  displayUrl,
  name,
  subtitle,
  imageSize,
}: {
  displayUrl?: string;
  name?: string;
  subtitle: string;
  imageSize: { width: number; height: number };
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (!displayUrl && !name) {
    return null;
  }

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewRow}>
        {displayUrl ? (
          <View
            style={[
              styles.previewImageContainer,
              { backgroundColor: theme.color.surfaceAlpha[scheme] },
            ]}
          >
            <Image
              trackLoadContext='chat.emote-action-sheet'
              source={displayUrl}
              cacheVariant='emote'
              style={imageSize}
              contentFit='contain'
              transition={50}
            />
          </View>
        ) : null}
        <View style={styles.previewMeta}>
          {name ? (
            <Text
              style={[styles.previewName, { color: theme.color.text[scheme] }]}
            >
              {name}
            </Text>
          ) : null}
          <Text
            style={[
              styles.previewHint,
              { color: theme.color.textSecondary[scheme] },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    paddingHorizontal: 2,
    paddingVertical: theme.space4,
  },
  previewHint: {
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
    marginTop: 4,
  },
  previewImageContainer: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  previewMeta: {
    flex: 1,
  },
  previewName: {
    fontSize: theme.fontSize18,
    fontWeight: Platform.select({ ios: '700', android: '600' }),
    lineHeight: theme.fontSize18 * 1.2,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
  },
});
