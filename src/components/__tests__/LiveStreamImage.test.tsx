import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import { LiveStreamImage } from '../LiveStreamImage';

describe('LiveStreamImage', () => {
  const thumbnail = 'https://example.com/thumbnail.jpg';

  test('renders correctly ', () => {
    render(<LiveStreamImage thumbnail={thumbnail} size="lg" />);

    expect(screen.getByTestId('LiveStreamImage-image')).toBeOnTheScreen();
  });
});
