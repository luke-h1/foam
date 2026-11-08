import { View } from 'react-native';

import { BrandIcon } from '@app/components/brand-icon/BrandIcon';
import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { Image } from '@app/components/image/Image';
import { Skeleton } from '@app/components/ui/skeleton/Skeleton';

import { styles } from './MediaLinkCard.styles';

interface InlineEmoteChipProps {
  isPending: boolean;
  thumbnail: string | undefined;
  title: string;
}

export function InlineEmoteChip({
  isPending,
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
    <View style={styles.inlineChip}>
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
    </View>
  );
}
