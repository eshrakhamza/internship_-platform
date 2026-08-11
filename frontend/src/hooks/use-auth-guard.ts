// hooks/use-auth-guard.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

export function useAuthGuard(allowedRoles?: string[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait until auth state actually resolves
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard'); // or wherever a "not allowed" redirect should go
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  return { user, isLoading, isAuthenticated };
}