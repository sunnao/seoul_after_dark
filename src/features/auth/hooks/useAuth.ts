import { User } from '@/features/auth/types/userTypes';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setIsLoginLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const matcheduser = users.find(
      (storagedUser) => storagedUser.email === email && storagedUser.password === password,
    );

    if (matcheduser) {
      const loggedInUser: User = {
        username: matcheduser.username,
        email: matcheduser.email,
        password: matcheduser.password,
      };
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    setUser(null);
    navigate('/login');
  };

  const join = (email: string, password: string, name?: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.find((storagedUser) => storagedUser.email === email)) {
      return { success: false, message: '이미 등록된 이메일입니다.' };
    }

    const username = name || email.split('@')[0];
    const newUser: User = { username, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, message: '회원가입 완료' };
  };

  return { user, login, logout, isLoginLoading, join };
};
