import { fireEvent, render, screen } from '@testing-library/react-native';

import { StreamListLayoutToggle } from '../StreamListLayoutToggle';

jest.mock('@app/lib/haptics', () => ({
  selection: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/components/ui/Icon/Icon', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    SymbolView: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

describe('StreamListLayoutToggle', () => {
  test('renders the media affordance and switches to media when compact', () => {
    const onChange = jest.fn();
    render(<StreamListLayoutToggle value='compact' onChange={onChange} />);

    expect(screen.getByLabelText('Switch to media layout')).toBeOnTheScreen();
    expect(screen.getByText('square.grid.2x2')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Switch to media layout'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('media');
  });

  test('renders the compact affordance and switches to compact when media', () => {
    const onChange = jest.fn();
    render(<StreamListLayoutToggle value='media' onChange={onChange} />);

    expect(screen.getByLabelText('Switch to compact layout')).toBeOnTheScreen();
    expect(screen.getByText('list.bullet')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Switch to compact layout'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('compact');
  });
});
