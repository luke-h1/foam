import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import React from 'react';
import FormattedDate from '../FormattedDate';

describe('FormattedDate', () => {
  describe('using default format', () => {
    test('renders correctly with string date', () => {
      render(<FormattedDate>2019-03-12</FormattedDate>);

      expect(screen.getByText('12 March 2019')).toBeOnTheScreen();
    });

    test('renders correctly with number date', () => {
      render(<FormattedDate>{1552395197000}</FormattedDate>);
      expect(screen.getByText('12 March 2019')).toBeOnTheScreen();
    });

    test('renders correctly with Date', () => {
      render(<FormattedDate>{new Date('2019-03-12')}</FormattedDate>);
      expect(screen.getByText('12 March 2019')).toBeOnTheScreen();
    });
  });

  describe('using custom format', () => {
    test('renders correctly with string date', () => {
      render(<FormattedDate format="yy MM eee">2019-03-12</FormattedDate>);

      expect(screen.getByText('19 03 Tue')).toBeOnTheScreen();
    });

    test('renders correctly with number date', () => {
      render(<FormattedDate format="yy MM eee">{1552395197000}</FormattedDate>);

      expect(screen.getByText('19 03 Tue')).toBeOnTheScreen();
    });

    test('renders correctly with Date', () => {
      render(
        <FormattedDate format="yy MM eee">
          {new Date('2019-03-12')}
        </FormattedDate>,
      );

      expect(screen.getByText('19 03 Tue')).toBeOnTheScreen();
    });
  });

  describe('invalid date', () => {
    test('does not render with string date', () => {
      render(<FormattedDate>not a date</FormattedDate>);
      expect(screen.queryByText('')).not.toBeOnTheScreen();
    });

    test('does not render with Date', () => {
      render(<FormattedDate>{new Date('not a date')}</FormattedDate>);

      expect(screen.queryByText('')).not.toBeOnTheScreen();
    });
  });
});
