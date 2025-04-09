import { User } from '@/features/auth/types/userTypes';
import { createContext, useContext } from 'react';

interface AuthContextType {
  user: User | null;
  setAppUser: (user: User|null) => void;
  authLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
