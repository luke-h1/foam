import type { Meta, StoryObj } from '@storybook/react';
import { ErrorInfo } from 'react';
import { View } from 'react-native';
import { ErrorDetails } from './ErrorDetails';

const meta = {
  title: 'screens/ErrorScreen/ErrorDetails',
  component: ErrorDetails,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    onReset: { action: 'Reset pressed' },
  },
} satisfies Meta<typeof ErrorDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

// Mock error with component stack
const mockErrorInfo: ErrorInfo = {
  componentStack: `
    in ErrorBoundary (at App.tsx:42)
    in NavigationContainer (at App.tsx:38)
    in Providers (at App.tsx:35)
    in App (at index.js:12)
    in RCTRootView (at RootView.tsx:15)
    in RootView (at index.js:12)
  `,
};

export const Default: Story = {
  args: {
    error: new Error('Something went wrong while rendering the component'),
    errorInfo: mockErrorInfo,
    onReset: () => {
      console.log('App reset');
    },
  },
};

export const WithLongErrorMessage: Story = {
  args: {
    error: new Error(
      'This is a very long error message that demonstrates how the ErrorDetails component handles longer error messages that might wrap to multiple lines. It should display properly and be readable.',
    ),
    errorInfo: mockErrorInfo,
    onReset: () => {
      console.log('App reset');
    },
  },
};

export const WithDetailedStackTrace: Story = {
  args: {
    error: new Error('TypeError: Cannot read property "map" of undefined'),
    errorInfo: {
      componentStack: `
        in ChatMessageList (at ChatScreen.tsx:156)
          in ErrorBoundary (at ChatScreen.tsx:142)
            in ChatScreen (at StreamStackNavigator.tsx:48)
              in Stack.Screen (at StreamStackNavigator.tsx:45)
                in StreamStackNavigator (at TabNavigator.tsx:78)
                  in TabNavigator (at AppNavigator.tsx:110)
                    in AppNavigator (at App.tsx:42)
                      in NavigationContainer (at App.tsx:38)
                        in Providers (at App.tsx:35)
                          in App (at index.js:12)
      `,
    },
    onReset: () => {
      console.log('App reset');
    },
  },
};

export const WithoutStackTrace: Story = {
  args: {
    error: new Error('Network request failed'),
    errorInfo: null,
    onReset: () => {
      console.log('App reset');
    },
  },
};

export const MinimalError: Story = {
  args: {
    error: new Error('Error'),
    errorInfo: {
      componentStack: 'in Component (at Component.tsx:1)',
    },
    onReset: () => {
      console.log('App reset');
    },
  },
};
