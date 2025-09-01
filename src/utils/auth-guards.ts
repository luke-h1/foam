import { useAuthContext } from '@app/context';
import { Href } from 'expo-router';

export interface AuthGuardConfig {
  requireAuth?: boolean;
  requireAnonymous?: boolean;
  redirectTo?: Href;
}

export function useAuthGuard(config: AuthGuardConfig = {}) {
  const { authState, ready } = useAuthContext();
  
  const isAuthenticated = authState?.isLoggedIn && !authState?.isAnonAuth;
  const isAnonymous = authState?.isAnonAuth || !authState?.isLoggedIn;

  // Check if user meets requirements
  const hasAccess = (() => {
    if (!ready) return false;
    
    if (config.requireAuth && !isAuthenticated) return false;
    if (config.requireAnonymous && !isAnonymous) return false;
    
    return true;
  })();

  // Determine redirect route
  const getRedirectRoute = (): Href | null => {
    if (!ready) return null;
    
    if (config.redirectTo) return config.redirectTo;
    
    // Default redirects based on auth state
    if (config.requireAuth && !isAuthenticated) {
      return '/(tabs)/top/top-streams';
    }
    
    if (config.requireAnonymous && !isAnonymous) {
      return '/(tabs)/following';
    }
    
    return null;
  };

  return {
    hasAccess,
    isAuthenticated,
    isAnonymous,
    isReady: ready,
    redirectRoute: getRedirectRoute(),
    authState,
  };
}

// Helper function to get available tabs based on auth state
export function getAvailableTabs(authState: any) {
  const isAuthenticated = authState?.isLoggedIn && !authState?.isAnonAuth;
  
  const tabs = [
    {
      name: 'top',
      label: 'Top',
      href: '/(tabs)/top',
      requireAuth: false,
    },
    {
      name: 'search', 
      label: 'Search',
      href: '/(tabs)/search',
      requireAuth: false,
    },
    {
      name: 'settings',
      label: 'Settings', 
      href: '/(tabs)/settings',
      requireAuth: false,
    },
  ];

  // Add following tab for authenticated users
  if (isAuthenticated) {
    tabs.unshift({
      name: 'following',
      label: 'Following',
      href: '/(tabs)/following',
      requireAuth: true,
    });
  }

  return tabs;
}
