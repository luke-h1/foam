import { screen } from '@testing-library/react-native';

import render from '@app/test/render';

import { LiveStreamImage } from '../LiveStreamImage/LiveStreamImage';

describe('LiveStreamImage', () => {
  const thumbnail = 'https://example.com/thumbnail.jpg';

  test('renders correctly ', () => {
    render(<LiveStreamImage thumbnail={thumbnail} size='lg' />);

    expect(screen.getByTestId('LiveStreamImage-image')).toBeOnTheScreen();
  });
});
