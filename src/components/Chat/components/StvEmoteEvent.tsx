import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { View, StyleSheet } from 'react-native';

interface StvEmoteEventProps {
  disableAnimations?: boolean;
  part: ParsedPart<'stv_emote_added' | 'stv_emote_removed'>;
}

export function StvEmoteEvent({
  part,
  disableAnimations = false,
}: StvEmoteEventProps) {
  const added = part.type === 'stv_emote_added';
  const removed = part.type === 'stv_emote_removed';

  const content = part.stvEvents?.data;
  if (!content) {
    return null;
  }
  const displayUrl = getDisplayEmoteUrl({
    url: content.url,
    static_url: content.static_url,
    disableAnimations,
  });

  const status = removed ? 'Removed' : 'Added';
  const actorName = content.actor?.display_name;

  return (
    <View
      style={[
        styles.container,
        added && styles.addedContainer,
        removed && styles.removedContainer,
      ]}
    >
      <View style={styles.notice}>
        <View style={styles.noticeHeader}>
          <BrandIcon name="stv" size="lg" />
          <Text style={styles.status}>
            <Text color={removed ? 'red' : 'green'}>{status}</Text>
            <Text> Emote</Text>
          </Text>
          {actorName ? <Text style={styles.userText}>{actorName}</Text> : null}
        </View>
      </View>
      <View style={styles.content}>
        <Image
          useNitro
          source={displayUrl}
          style={styles.emoteImage}
          transition={0}
          contentFit="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.emoteName}>{content.name}</Text>
          {content.creator && (
            <Text type="xs" color="gray.accentHover">
              By {content.creator}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addedContainer: {
    borderLeftColor: theme.colors.green.accent,
    borderRightColor: theme.colors.green.accent,
  },
  container: {
    backgroundColor: theme.colors.gray.uiActive,
    borderCurve: 'continuous',
    borderLeftColor: theme.colors.accent.accent,
    borderLeftWidth: 3,
    borderRightColor: theme.colors.accent.accent,
    borderRightWidth: 3,
    padding: theme.spacing.xs,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  emoteImage: {
    height: 50,
    marginRight: theme.spacing.md,
    width: 140,
  },
  emoteName: {
    fontSize: theme.font.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  notice: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noticeHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiActive,
    flexDirection: 'row',
    paddingInline: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    width: '100%',
  },
  removedContainer: {
    borderLeftColor: theme.colors.red.accent,
    borderRightColor: theme.colors.red.accent,
  },
  status: {
    marginLeft: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  userText: {
    color: theme.colors.gray.accentHover,
    fontSize: theme.font.fontSize.xs,
    marginLeft: 'auto',
  },
});
