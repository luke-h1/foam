import { ReactElement, ReactNode } from 'react';
import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render as baseRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/react-native';

import { AuthContextTestProvider } from '@app/context/AuthContext';

const TEST_TOKEN_EXPIRES_AT = 4_102_444_800_000;

const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
} satisfies Metrics;

export const DefaultWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={queryClient}>
        <AuthContextTestProvider
          ready
          authState={{
            isLoggedIn: false,
            isAnonAuth: true,
            token: {
              accessToken: 'test-token',
              expiresIn: 3600,
              tokenType: 'bearer',
              expiresAt: TEST_TOKEN_EXPIRES_AT,
            },
          }}
          user={undefined}
          loginWithTwitch={jest.fn()}
          logout={jest.fn()}
          populateAuthState={jest.fn()}
          fetchAnonToken={jest.fn()}
        >
          {children}
        </AuthContextTestProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

/**
 * Custom test render function that is pre-configured with any contexts
 * that would otherwise create unnecessary boilerplate.
 */
export default function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
): RenderResult {
  return {
    ...baseRender(ui, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DefaultWrapper>{children}</DefaultWrapper>
      ),
      ...options,
    }),
  };
}
