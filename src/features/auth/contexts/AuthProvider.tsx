import { User } from '@/features/auth/types/userTypes';
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from '@/features/auth/contexts/AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const setAppUser = (userData: User | null) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, setAppUser }}>{children}</AuthContext.Provider>
  );
};
