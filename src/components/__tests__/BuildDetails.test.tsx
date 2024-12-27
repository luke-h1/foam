import render from '@app/test/render';
import { screen } from '@testing-library/react-native';
import { useUpdates } from 'expo-updates';
import React from 'react';
import pkg from '../../../package.json';
import BuildDetails from '../BuildDetails';

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '100',
}));

jest.mock('expo-updates', () => ({
  useUpdates: jest.fn(),
}));

describe('BuildDetails', () => {
  test('should render version and build info', () => {
    (useUpdates as jest.Mock).mockReturnValue({
      currentlyRunning: null,
    });

    render(<BuildDetails />);

    expect(screen.getByTestId('BuildDetails-pkgVersion')).toHaveTextContent(
      pkg.version,
    );
  });

  test('should render updateId if available', () => {
    const updateId = '12345';
    (useUpdates as jest.Mock).mockReturnValue({
      currentlyRunning: {
        updateId,
        emergencyLaunchReason: '',
        isEmbeddedLaunch: false,
        isEmergencyLaunch: false,
        channel: undefined,
        createdAt: new Date(),
        manifest: {},
        runtimeVersion: '1',
      },
    });

    render(<BuildDetails />);

    expect(screen.getByText(updateId)).toBeOnTheScreen();
  });
});
