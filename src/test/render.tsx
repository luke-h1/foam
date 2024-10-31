import { AuthContextTestProvider } from '@app/context/AuthContext';
import RootNavigator from '@app/navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render as baseRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/react-native';
import { ReactElement, ReactNode } from 'react';

const DefaultWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextTestProvider>
        <NavigationContainer>
          <RootNavigator />
          {/* todo - auth context test provider */}
          {children}
        </NavigationContainer>
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
    ...(baseRender(ui, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DefaultWrapper>{children}</DefaultWrapper>
      ),
      ...options,
    }) as RenderResult),
  };
}
