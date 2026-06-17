import { memo } from 'react';
import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';
import { View, StyleSheet } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from './util/chatNoticeAccents';
import { ChatNoticeMetaRow } from './ChatMessage/renderers/ChatNoticeMetaRow';
import { styles as chatStyles } from './ChatMessage/RichChatMessage.styles';
import i18next from '@app/i18n/i18next';

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

  const status = removed
    ? i18next.t('chat:notices.removed')
    : i18next.t('chat:notices.added');
  const accentColor = removed
    ? CHAT_NOTICE_ACCENTS.stvRemoved
    : CHAT_NOTICE_ACCENTS.stvAdded;
  const actorName = content.actor?.display_name;

  return (
    <View
      style={[
        chatStyles.messageColumn,
        chatStyles.stvEmoteNoticeSurface,
        added && chatStyles.stvEmoteAddedSurface,
        removed && chatStyles.stvEmoteRemovedSurface,
      ]}
    >
      <ChatNoticeMetaRow icon='sparkles' labelColor={accentColor}>
        <View style={styles.metaContent}>
          <BrandIcon name='stv' size='sm' />
          <Text
            style={[
              chatStyles.messageMetaText,
              chatStyles.messageMetaTextStrong,
              { color: accentColor },
            ]}
          >
            {status} emote
          </Text>
          {actorName ? (
            <Text style={styles.actorText}> · {actorName}</Text>
          ) : null}
        </View>
      </ChatNoticeMetaRow>
      <View style={styles.content}>
        <Image
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
          {content.creator ? (
            <Text type='xs' color='gray.accentHover'>
              By {content.creator}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const StvEmoteEvent = memo(StvEmoteEventComponent);

const styles = StyleSheet.create({
  actorText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    lineHeight: 15,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emoteImage: {
    height: 28,
    width: 56,
  },
  emoteName: {
    fontSize: 12,
    lineHeight: 15,
  },
  metaContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    gap: 4,
    minWidth: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
});
