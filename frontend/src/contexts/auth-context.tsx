// contexts/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../lib/api-client';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, otp: string) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token found on load:', !!token);
      
      if (token) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('👤 User loaded:', parsedUser.email);
            
            // Redirect based on role if on login page
            const pathname = window.location.pathname;
            if (pathname === '/login' || pathname === '/') {
              if (parsedUser.role === 'RECRUITER' || parsedUser.role === 'ADMIN') {
                window.location.href = '/recruiter/dashboard';
              } else {
                window.location.href = '/dashboard';
              }
            }
          } catch (e) {
            console.error('Failed to parse user:', e);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
          }
        }
      }
    }
    setIsLoading(false);
  }, []);

  const sendOTP = async (email: string) => {
    await apiClient.post('/auth/send-otp', { email });
  };

  const login = async (email: string, otp: string) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    const { accessToken, refreshToken, user } = response.data;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    setUser(user);
    console.log('✅ Login successful:', user.email);
    
    // Redirect based on role
    if (user.role === 'RECRUITER' || user.role === 'ADMIN') {
      window.location.href = '/recruiter/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    setUser(null);
    console.log('👋 User logged out');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        sendOTP,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}