import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.isInitialized) {
      store.initialize();
    }
  }, [store.isInitialized]);

  return store;
};

export const useRequireAuth = (requiredRole?: 'admin' | 'contractor' | 'owner') => {
  const { user, role, isLoading, isInitialized } = useAuth();

  const isAuthenticated = !!user;
  const hasRequiredRole = !requiredRole || role === requiredRole || role === 'admin';
  const isAuthorized = isAuthenticated && hasRequiredRole;

  return {
    isAuthenticated,
    isAuthorized,
    isLoading: isLoading || !isInitialized,
    role,
  };
};
