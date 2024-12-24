import { spacing } from '@app/styles';
import { openLinkInBrowser } from '@app/utils/openLinkInBrowser';
import { GestureResponderEvent, ViewStyle } from 'react-native';
import AutoImage from './AutoImage';
import Button from './Button';

interface Props {
  children: string;
  style?: ViewStyle;
  openLink: string | ((event: GestureResponderEvent) => void);
  preset?: 'link' | 'reversed';
}

export default function ButtonLink({
  children,
  preset,
  style,
  ...props
}: Props) {
  const openLink = (e: GestureResponderEvent) => {
    if (typeof props.openLink === 'function') {
      props.openLink(e);
      // eslint-disable-next-line no-useless-return
      return;
    }
    openLinkInBrowser(props.openLink);
  };

  return (
    <Button
      preset={preset}
      onPress={openLink}
      accessibilityRole="link"
      style={style}
      // eslint-disable-next-line react/no-unstable-nested-components
      RightAccessory={() => (
        <AutoImage
          // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
          source={require('../../../assets/icons/arrows.png')}
          style={$arrow}
        />
      )}
    >
      {children}
    </Button>
  );
}

const $arrow = {
  height: 24,
  width: 24,
  marginStart: spacing.extraSmall,
};
