/* eslint-disable react-doctor/rn-no-raw-text -- FormattedDate children are test inputs */
import { screen } from '@testing-library/react-native';

import render from '@app/test/render';

import { FormattedDate } from '../FormattedDate/FormattedDate';

describe('FormattedDate', () => {
  describe('using default format', () => {
    test('renders correctly with string date', () => {
      render(<FormattedDate value='2019-03-12' />);

      expect(screen.getByText('12 March 2019')).toBeOnTheScreen();
    });

    test('renders correctly with epoch date', () => {
      render(<FormattedDate value={1552395197000} />);
      expect(screen.getByText('12 March 2019')).toBeOnTheScreen();
    });

    test('renders correctly with Date', () => {
      render(<FormattedDate value={new Date('2019-03-12')} />);
      expect(screen.getByText('12 March 2019')).toBeOnTheScreen();
    });
  });

  describe('using custom format', () => {
    test('renders correctly with string date', () => {
      render(<FormattedDate format='yy MM eee' value='2019-03-12' />);

      expect(screen.getByText('19 03 Tue')).toBeOnTheScreen();
    });

    test('renders correctly with number date', () => {
      render(<FormattedDate format='yy MM eee' value={1552395197000} />);

      expect(screen.getByText('19 03 Tue')).toBeOnTheScreen();
    });

    test('renders correctly with Date', () => {
      render(
        <FormattedDate format='yy MM eee' value={new Date('2019-03-12')} />,
      );

      expect(screen.getByText('19 03 Tue')).toBeOnTheScreen();
    });
  });

  describe('invalid date', () => {
    test('does not render with string date', () => {
      render(<FormattedDate value='not a date' />);

      // FormattedDate returns null for an invalid date, so nothing is rendered
      // and the raw input string is never shown.
      expect(screen.root).toBeEmptyElement();
      expect(screen.queryByText('not a date')).not.toBeOnTheScreen();
    });

    test('does not render with Date', () => {
      render(<FormattedDate value={new Date('not a date')} />);

      expect(screen.root).toBeEmptyElement();
    });
  });
});
