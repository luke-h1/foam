import { Dimensions } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { LiveStreamCardSkeletons } from '../live-stream-card-skeleton';

describe('LiveStreamCardSkeletons', () => {
  test('fills the window with compact rows', () => {
    const { height } = Dimensions.get('window');
    const compactRowHeight = 101;

    render(<LiveStreamCardSkeletons layout='compact' />);

    expect(screen.getAllByTestId('stream-skeleton').length).toEqual(
      Math.ceil(height / compactRowHeight),
    );
  });

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
