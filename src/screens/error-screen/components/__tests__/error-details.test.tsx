import { fireEvent, screen } from '@testing-library/react-native';

import render from '@app/test/render';

import { ErrorDetails } from '../error-details';

describe('ErrorDetails', () => {
  test('calls onReset when Try again is pressed', () => {
    const onReset = jest.fn();

    render(
      <ErrorDetails
        error={new Error('boom')}
        errorInfo={null}
        onReset={onReset}
      />,
    );

    fireEvent.press(screen.getByText('Try again'));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  test('hides the technical details until the user opens them', () => {
    render(
      <ErrorDetails
        error={new Error('boom')}
        errorInfo={{ componentStack: '\n    in Screen' }}
        onReset={jest.fn()}
      />,
    );

    expect(screen.queryByText('boom')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByText('Show details'));

    expect(screen.getByText('boom')).toBeOnTheScreen();
    expect(screen.getByText('Hide details')).toBeOnTheScreen();
  });
});
