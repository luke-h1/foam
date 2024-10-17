import render from '@app/test/render';
import { fireEvent, screen } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  test('renders button with title', () => {
    render(<Button title="Click me" onPress={() => {}} />);

    expect(screen.getByText('Click me')).toBeOnTheScreen();
  });

  test('handles onPress', () => {
    const mockOnPress = jest.fn();
    render(<Button title="Click me" onPress={mockOnPress} />);

    fireEvent.press(screen.getByText('Click me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('displays loading indicator', () => {
    render(<Button title="Click me" onPress={() => {}} isLoading />);

    expect(screen.queryByText('Click me')).not.toBeOnTheScreen();
    expect(screen.getByTestId('button-loading')).toBeOnTheScreen();
  });
});
