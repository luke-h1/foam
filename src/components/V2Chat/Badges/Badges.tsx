import { useAppSelector } from '@app/store/hooks';
import createHtmlBadge from '@app/store/reducers/chat/util/createHtmlBadge';
import { HtmlBadge } from '@app/store/reducers/chat/util/messages/types/badges';
import { MessageTypePrivate } from '@app/store/reducers/chat/util/messages/types/messages';
import { badgesSelector } from '@app/store/selectors/badges';
import { Image, View } from 'react-native';

interface Props {
  badges: MessageTypePrivate['badges'];
}

export default function Badges({ badges }: Props) {
  const allBadges = useAppSelector(badgesSelector);

  if (badges.length === 0) {
    return null;
  }

  const htmlBadges = badges
    .map(badge => createHtmlBadge(allBadges, badge) as HtmlBadge)
    .filter(Boolean);

  return (
    <View>
      {htmlBadges.map(({ title, alt, src, srcSet, bgColor }) => (
        <Image
          key={title}
          src={src}
          accessibilityLabel={alt}
          srcSet={srcSet}
          style={{
            backgroundColor: bgColor || '',
          }}
        />
      ))}
    </View>
  );
}
