import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandIcon } from '@app/components/brand-icon/BrandIcon';
import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { Image } from '@app/components/image/Image';
import { resolveThemeColor } from '@app/styles/themes';
import type { MessageToken } from '@app/utils/chat/messageToken';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

import { styles as chatStyles } from './chat-message/ChatRow.styles';
import { getChatTextStyles } from './chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from './chat-message/renderers/ChatNoticeMetaRow';
import type { ChatFontScale } from './chat-message/util/chatScale';
import { CHAT_NOTICE_ACCENTS } from './util/chatNoticeAccents';

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
        icon='sparkles'
        {...{ compact, fontScale, labelColor: accentColor }}
      >
        <View style={styles.metaContent}>
          <BrandIcon name='stv' size='sm' />
          <ChatText
            style={[
              textStyles.meta,
              textStyles.metaStrong,
              { color: accentColor },
            ]}
          >
            {status} emote
          </ChatText>
          {actorName ? (
            <ChatText style={textStyles.meta}> · {actorName}</ChatText>
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
          <ChatText style={textStyles.meta}>{content.name}</ChatText>
          {content.creator ? (
            <ChatText style={[textStyles.meta, styles.creator]}>
              By {content.creator}
            </ChatText>
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
  creator: {
    color: resolveThemeColor('gray.accentHover'),
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
