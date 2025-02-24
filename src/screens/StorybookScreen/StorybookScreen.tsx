import { useAppNavigation, useHeader } from '@app/hooks';
import { View } from 'react-native';
import StoryBook from '../../../.storybook';

export function StorybookScreen() {
  const { goBack } = useAppNavigation();
  useHeader({
    title: 'Storybook',
    onLeftPress: () => goBack(),
    leftIcon: 'arrow-left',
  });
  return (
    <View>
      <StoryBook />
    </View>
  );
}
