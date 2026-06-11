import { render, screen } from '@testing-library/react-native';
import { AuthCallbackScreen } from '@app/screens/AuthCallbackScreen';

describe('AuthCallbackScreen', () => {
  test('renders completing sign-in message', () => {
    render(<AuthCallbackScreen />);

    expect(screen.getByText('Completing sign in…')).toBeTruthy();
  });
});
