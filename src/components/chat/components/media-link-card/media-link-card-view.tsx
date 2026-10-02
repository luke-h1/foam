import { View } from 'react-native';

import { BrandIcon } from '@app/components/brand-icon/brand-icon';
import { Button } from '@app/components/button/button';
import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { Image } from '@app/components/image/image';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { theme } from '@app/styles/themes';

import { styles } from './media-link-card.styles';

interface MediaLinkCardViewProps {
  isPending: boolean;
  isTwitchClip: boolean;
  mediaImageFit: 'contain' | 'cover';
  mediaLabel: string;
  mediaMeta: string;
  onPress: () => void;
  thumbnail: string | undefined;
  title: string;
}

/**
 * The full card a Twitch clip link, or a 7TV emote link on its own line,
 * renders as.
 */
export function MediaLinkCardView({
  isPending,
  isTwitchClip,
  mediaImageFit,
  mediaLabel,
  mediaMeta,
  onPress,
  thumbnail,
  title,
}: MediaLinkCardViewProps) {
  if (isPending && !thumbnail) {
    return (
      <View style={[styles.mediaContainer, styles.mediaCard]}>
        <Skeleton shimmer={false} style={styles.mediaThumbnailFrame} />
        <View style={styles.mediaInfo}>
          <Skeleton shimmer={false} style={styles.mediaTitleSkeleton} />
          <Skeleton shimmer={false} style={styles.mediaMetaSkeleton} />
        </View>
      </View>
    );
  }

  return (
    <Button
      accessibilityRole='button'
      label={title}
      style={styles.mediaContainer}
      onPress={onPress}
    >
      <View style={styles.mediaCard}>
        <View style={styles.mediaThumbnailFrame}>
          {thumbnail ? (
            <Image
              trackLoadContext='chat.media-link-card'
              source={thumbnail}
              cacheVariant='thumbnail'
              style={styles.mediaThumbnail}
              contentFit={mediaImageFit}
            />
          ) : (
            <View style={[styles.mediaThumbnail, styles.mediaThumbnailEmpty]}>
              {isTwitchClip ? (
                <SymbolView
                  name='play.tv.fill'
                  size={16}
                  tintColor={theme.colorPlum}
                />
              ) : (
                <BrandIcon name='stv' size='sm' />
              )}
            </View>
          )}
          {isTwitchClip ? (
            <View style={styles.playBadge}>
              <SymbolView
                name='play.fill'
                size={10}
                tintColor={theme.colorWhite}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.mediaInfo}>
          <View style={styles.mediaEyebrowRow}>
            {isTwitchClip ? (
              <SymbolView
                name='play.tv.fill'
                size={12}
                tintColor={theme.colorPlum}
              />
            ) : (
              <BrandIcon name='stv' size='xs' />
            )}
            <ChatText style={styles.mediaEyebrow}>{mediaLabel}</ChatText>
          </View>
          <ChatText
            ellipsizeMode='tail'
            numberOfLines={1}
            style={styles.mediaTitle}
          >
            {title}
          </ChatText>
          <ChatText
            ellipsizeMode='tail'
            numberOfLines={1}
            style={styles.mediaMeta}
          >
            {mediaMeta}
          </ChatText>
        </View>
      </View>
    </Button>
  );
}
