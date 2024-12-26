import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import LiveStreamImage from '../LiveStreamImage';

describe('LiveStreamImage', () => {
  const thumbnail = 'https://example.com/thumbnail.jpg';

  test('renders correctly ', () => {
    render(<LiveStreamImage thumbnail={thumbnail} size="large" />);

    expect(screen.getByTestId('LiveStreamImage-image')).toBeOnTheScreen();
  });

  test('renders placeholder image when no thumbnail is provided', () => {
    render(<LiveStreamImage size="large" />);

    expect(screen.getByTestId('LiveStreamImage-placeholder')).toBeOnTheScreen();
    expect(screen.queryByTestId('LiveStreamImage-image')).not.toBeOnTheScreen();
  });
});
