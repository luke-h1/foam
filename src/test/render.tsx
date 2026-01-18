import { AuthContextTestProvider } from '@app/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render as baseRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/react-native';
import { ReactElement, ReactNode } from 'react';

export const DefaultWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
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
            expiresAt: Date.now() + 3600000,
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
