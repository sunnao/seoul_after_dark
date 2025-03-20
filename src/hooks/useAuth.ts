import { useState, useEffect } from 'react';

interface User {
  username: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(
      (storagedUser: { email: string; password: string }) =>
        storagedUser.email === email && storagedUser.password === password,
    );

    if (user) {
      const userData = { username: user.username, email: user.email };
      localStorage.setItem('loggedInUser', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    setUser(null);
  };

  const join = (username: string, email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.find((storagedUser: { email: string }) => storagedUser.email === email)) {
      return { success: false, message: '이미 등록된 이메일입니다.' };
    }

    const newUser = { username, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, message: '회원가입 완료' };
  };

  return { user, login, logout, isLoading, join };
};
