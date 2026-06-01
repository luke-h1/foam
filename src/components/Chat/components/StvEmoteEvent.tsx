import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';

interface StvEmoteEventProps {
  disableAnimations?: boolean;
  part: ParsedPart<'stv_emote_added' | 'stv_emote_removed'>;
}

function StvEmoteEventComponent({
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
          <BrandIcon name='stv' size='lg' />
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
          trackLoadTime
          trackLoadContext='chat.stv-emote-event'
          source={displayUrl}
          cacheVariant='emote'
          style={styles.emoteImage}
          transition={0}
          contentFit='contain'
        />
        <View style={styles.textContainer}>
          <Text style={styles.emoteName}>{content.name}</Text>
          {content.creator && (
            <Text type='xs' color='gray.accentHover'>
              By {content.creator}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export const StvEmoteEvent = memo(StvEmoteEventComponent);

const styles = StyleSheet.create({
  addedContainer: {
    borderLeftColor: theme.colorGreen,
    borderRightColor: theme.colorGreen,
  },
  container: {
    backgroundColor: theme.color.backgroundElement.dark,
    borderCurve: 'continuous',
    borderLeftColor: theme.colorDarkGreen,
    borderLeftWidth: 3,
    borderRightColor: theme.colorDarkGreen,
    borderRightWidth: 3,
    padding: theme.space8,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: theme.space12,
  },
  emoteImage: {
    height: 50,
    marginRight: theme.space16,
    width: 140,
  },
  emoteName: {
    fontSize: theme.fontSize14,
    marginTop: theme.space8,
  },
  notice: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noticeHeader: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundElement.dark,
    flexDirection: 'row',
    paddingInline: theme.space12,
    paddingVertical: theme.space8,
    width: '100%',
  },
  removedContainer: {
    borderLeftColor: theme.colorRed,
    borderRightColor: theme.colorRed,
  },
  status: {
    marginLeft: theme.space16,
  },
  textContainer: {
    flex: 1,
  },
  userText: {
    color: theme.colorGreyHover,
    fontSize: theme.fontSize12,
    marginLeft: 'auto',
  },
});
