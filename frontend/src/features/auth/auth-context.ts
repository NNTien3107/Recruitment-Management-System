import { createContext, useContext } from 'react';
import type { AuthUser } from './types';

export interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
}
