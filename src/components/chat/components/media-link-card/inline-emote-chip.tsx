import { Pressable, View } from 'react-native';

import { BrandIcon } from '@app/components/brand-icon/brand-icon';
import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { Image } from '@app/components/image/image';
import { Skeleton } from '@app/components/ui/skeleton/skeleton';

import { styles } from './media-link-card.styles';

interface InlineEmoteChipProps {
  isPending: boolean;
  onPress: () => void;
  thumbnail: string | undefined;
  title: string;
}

/**
 * The compact form a 7TV emote link takes inside a chat line.
 */
export function InlineEmoteChip({
  isPending,
  onPress,
  thumbnail,
  title,
}: InlineEmoteChipProps) {
  if (isPending) {
    return (
      <View style={styles.inlineChip}>
        <Skeleton shimmer={false} style={styles.inlineThumbnail} />
        <Skeleton shimmer={false} style={styles.inlineTitleSkeleton} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [styles.inlineChip, pressed && { opacity: 0.7 }]}
    >
      {thumbnail ? (
        <Image
          trackLoadContext='chat.media-link-inline'
          source={thumbnail}
          cacheVariant='thumbnail'
          style={styles.inlineThumbnail}
          contentFit='contain'
        />
      ) : null}
      <ChatText
        ellipsizeMode='tail'
        numberOfLines={1}
        style={styles.inlineTitle}
      >
        {title}
      </ChatText>
      <BrandIcon name='stv' size='xs' />
    </Pressable>
  );
}
