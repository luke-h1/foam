import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandIcon } from '@app/components/brand-icon/brand-icon';
import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';
import { MessageToken } from '@app/utils/chat/message-token';
import { getDisplayEmoteUrl } from '@app/utils/emote/get-display-emote-url';

import { styles as chatStyles } from './chat-message/chat-row.styles';
import { getChatTextStyles } from './chat-message/chat-text.styles';
import { ChatNoticeMetaRow } from './chat-message/renderers/chat-notice-meta-row';
import type { ChatFontScale } from './chat-message/util/chat-scale';
import { CHAT_NOTICE_ACCENTS } from './util/chat-notice-accents';

interface StvEmoteEventProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  token: MessageToken<'stvEmoteAdded' | 'stvEmoteRemoved'>;
}

function StvEmoteEventComponent({
  compact,
  fontScale,
  token,
  disableAnimations = false,
}: StvEmoteEventProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
  const added = token.type === 'stvEmoteAdded';
  const removed = token.type === 'stvEmoteRemoved';

  const content = token.stvEvents?.data;

  if (!content) {
    return null;
  }

  const displayUrl = getDisplayEmoteUrl({
    url: content.url,
    static_url: content.static_url,
    disableAnimations,
  });

  const status = removed ? 'Removed' : 'Added';

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
      <ChatNoticeMetaRow
        compact={compact}
        fontScale={fontScale}
        icon='sparkles'
        labelColor={accentColor}
      >
        <View style={styles.metaContent}>
          <BrandIcon name='stv' size='sm' />
          <Text
            style={[
              textStyles.meta,
              textStyles.metaStrong,
              { color: accentColor },
            ]}
          >
            {status} emote
          </Text>
          {actorName ? (
            <Text style={textStyles.meta}> · {actorName}</Text>
          ) : null}
        </View>
      </ChatNoticeMetaRow>
      <View style={styles.content}>
        <Image
          trackLoadContext='chat.stv-emote-event'
          source={displayUrl}
          cacheVariant='emote'
          style={styles.emoteImage}
          transition={0}
          contentFit='contain'
        />
        <View style={styles.textContainer}>
          <Text style={textStyles.meta}>{content.name}</Text>
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
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emoteImage: {
    height: 28,
    width: 56,
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
