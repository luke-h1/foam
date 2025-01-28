import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import { useUpdates } from 'expo-updates';
import React from 'react';
import { BuildDetails } from '../BuildDetails';

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '100',
}));

jest.mock('expo-updates', () => ({
  useUpdates: jest.fn(),
}));

describe('BuildDetails', () => {
  test('should render native application version and build version', () => {
    (useUpdates as jest.Mock).mockReturnValue({
      currentlyRunning: null,
    });

    render(<BuildDetails />);

    expect(
      screen.getByTestId('BuildDetails-nativeAppVersion'),
    ).toHaveTextContent('v1.0.0');
    expect(
      screen.getByTestId('BuildDetails-nativeBuildVersion'),
    ).toHaveTextContent('Native build version: 100');
  });
});
