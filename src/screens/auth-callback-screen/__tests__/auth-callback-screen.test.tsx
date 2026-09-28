import { render, screen } from '@testing-library/react-native';

import { AuthCallbackScreen } from '@app/screens/auth-callback-screen/auth-callback-screen';

describe('AuthCallbackScreen', () => {
  test('renders completing sign-in message', () => {
    render(<AuthCallbackScreen />);

    expect(screen.getByText('Completing sign in…')).toBeOnTheScreen();
  });
});
