import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render as baseRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react-native';

import { AuthContextTestProvider } from '@app/context/AuthContext';
import { TEST_SAFE_AREA_METRICS } from '@app/test/safe-area';

const TEST_TOKEN_EXPIRES_AT = 4_102_444_800_000;

export function createTestQueryClient() {
  // gcTime Infinity stops react-query from scheduling a garbage-collection timer that outlives the test.
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
}

export const DefaultWrapper = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createTestQueryClient);

  useEffect(() => () => queryClient.clear(), [queryClient]);

  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <QueryClientProvider client={queryClient}>
        <AuthContextTestProvider
          ready
          user={undefined}
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
          loginWithTwitch={jest.fn()}
          logout={jest.fn()}
        >
          {children}
        </AuthContextTestProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

export default function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
): RenderResult {
  return {
    ...baseRender(ui, {
      wrapper: DefaultWrapper,
      ...options,
    }),
  };
}
