import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import LiveStreamImage from '../LiveStreamImage';

describe('LiveStreamImage', () => {
  const startedAt = new Date().toISOString();
  const thumbnail = 'https://example.com/thumbnail.jpg';

  test('renders correctly with time thumbnail', () => {
    render(
      <LiveStreamImage
        thumbnail={thumbnail}
        startedAt={startedAt}
        size="large"
      />,
    );

    expect(screen.getByTestId('LiveStreamImage-image')).toBeOnTheScreen();
    expect(screen.getByText(/00m/)).toBeOnTheScreen();
  });

  test('renders placeholder image when no thumbnail is provided', () => {
    render(<LiveStreamImage size="large" startedAt={startedAt} />);

    expect(screen.getByTestId('LiveStreamImage-placeholder')).toBeOnTheScreen();
    expect(screen.queryByTestId('LiveStreamImage-image')).not.toBeOnTheScreen();
  });
});
