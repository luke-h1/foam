import { render, fireEvent, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Button from '../Button/Button';

jest.mock('expo-haptics');

describe('Button', () => {
  const mockOnpress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    render(<Button title="click me" onPress={mockOnpress} />);
    expect(screen.getByText('click me')).toBeTruthy();
  });

  test('calls onPress when button is pressed', () => {
    render(<Button title="click me" onPress={mockOnpress} />);
    fireEvent.press(screen.getByText('click me'));
    expect(mockOnpress).toHaveBeenCalled();
  });

  test('triggers haptic feedback when on mobile', () => {
    Platform.OS = 'ios';
    render(<Button title="click me" onPress={mockOnpress} />);
    fireEvent.press(screen.getByText('click me'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light,
    );
  });
});
