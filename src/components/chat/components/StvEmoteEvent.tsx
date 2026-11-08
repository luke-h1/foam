import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandIcon } from '@app/components/brand-icon/BrandIcon';
import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import { Image } from '@app/components/image/Image';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import { resolveThemeColor } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

import { styles as chatStyles } from './chat-message/ChatRow.styles';
import { getChatTextStyles } from './chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from './chat-message/renderers/ChatNoticeMetaRow';
import { getChatScale } from './chat-message/util/chatScale';

interface StvEmoteEventProps {
  density?: ChatDensity;
  disableEmoteAnimations?: boolean;
  fontScale?: ChatFontScale;
  token: MessageToken<'stvEmoteAdded' | 'stvEmoteRemoved'>;
}

function StvEmoteEventComponent({
  density,
  fontScale,
  token,
  disableEmoteAnimations = false,
}: StvEmoteEventProps) {
  const textStyles = getChatTextStyles(fontScale, density);
  const { emoteSize, gap } = getChatScale(fontScale, density);
  const added = token.type === 'stvEmoteAdded';
  const removed = token.type === 'stvEmoteRemoved';

  const content = token.stvEvents?.data;

  if (!content) {
    return null;
  }

  const displayUrl = getDisplayEmoteUrl({
    url: content.url,
    static_url: content.static_url,
    disableAnimations: disableEmoteAnimations,
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
        textStyles.surface,
        added && chatStyles.stvEmoteAddedSurface,
        removed && chatStyles.stvEmoteRemovedSurface,
      ]}
    >
      <ChatNoticeMetaRow
        icon='sparkles'
        {...{ density, fontScale, labelColor: accentColor }}
      >
        <View style={[styles.metaContent, textStyles.stackGap]}>
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
      <View style={[styles.content, { gap: gap * 2 }]}>
        <Image
          trackLoadContext='chat.stv-emote-event'
          source={displayUrl}
          cacheVariant='emote'
          style={{ height: emoteSize, width: emoteSize * 2 }}
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
  },
  creator: {
    color: resolveThemeColor('gray.accentHover'),
  },
  metaContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
});
