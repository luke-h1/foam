import { Screen } from '@app/components/Screen';
import StoryBook from '../../../.storybook';

export function StorybookScreen() {
  return (
    <Screen safeAreaEdges={[]} preset="fixed">
      <StoryBook />
    </Screen>
  );
}
