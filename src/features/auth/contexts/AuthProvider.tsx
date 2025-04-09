import { User } from '@/features/auth/types/userTypes';
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from '@/features/auth/contexts/AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setAuthLoading(false);
  }, []);

  const setAppUser = (userData: User | null) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, setAppUser, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
