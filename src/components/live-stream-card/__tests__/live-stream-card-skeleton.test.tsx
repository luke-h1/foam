import { render, screen } from '@testing-library/react-native';

import { LiveStreamCardSkeletons } from '../live-stream-card-skeleton';

describe('LiveStreamCardSkeletons', () => {
  test('renders fewer media rows than compact rows', () => {
    render(<LiveStreamCardSkeletons layout='compact' />);
    const compactCount = screen.getAllByTestId('stream-skeleton').length;

    screen.unmount();
    render(<LiveStreamCardSkeletons layout='media' />);

    expect(screen.getAllByTestId('stream-skeleton').length).toBeLessThan(
      compactCount,
    );
  });
});
