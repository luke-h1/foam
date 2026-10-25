import { fireEvent, render, screen } from '@testing-library/react-native';

import { StreamListLayoutToggle } from '../StreamListLayoutToggle';

describe('StreamListLayoutToggle', () => {
  test('renders the media affordance and switches to media when compact', () => {
    const onChange = jest.fn();
    render(<StreamListLayoutToggle value='compact' onChange={onChange} />);

    expect(screen.getByLabelText('Switch to media layout')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Switch to media layout'));

    expect(onChange).toHaveBeenCalledTimes(1);

    expect(onChange).toHaveBeenCalledWith('media');
  });

  test('renders the compact affordance and switches to compact when media', () => {
    const onChange = jest.fn();
    render(<StreamListLayoutToggle value='media' onChange={onChange} />);

    expect(screen.getByLabelText('Switch to compact layout')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Switch to compact layout'));

    expect(onChange).toHaveBeenCalledTimes(1);

    expect(onChange).toHaveBeenCalledWith('compact');
  });
});
