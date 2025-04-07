import { User } from '@/features/auth/types/userTypes';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // 로컬 스토리지에서 최신 유저 정보 가져오기
  const refreshUser = useCallback(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    setIsLoginLoading(false);
  }, [refreshUser]);

  const login = (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const matchedUser = users.find(
      (storedUser) => storedUser.email === email && storedUser.password === password,
    );

    if (matchedUser) {
      const loggedInUser: User = {
        username: matchedUser.username,
        email: matchedUser.email,
        password: matchedUser.password,
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
    navigate('/');
  };

  const join = (email: string, password: string, name: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.find((storedUser) => storedUser.email === email)) {
      return { success: false, message: '이미 등록된 이메일입니다.' };
    }

    const username = name || email.split('@')[0];
    const newUser: User = { username, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, message: '회원가입 완료' };
  };

  const updateUser = useCallback(
    (email: string, password: string, name: string, favoritePlaceIds?: string[]) => {
      const username = name || email.split('@')[0];
      const newUserData: User = { email, password, username, favoritePlaceIds };

      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

      for (let i = 0; i < users.length; i++) {
        if (users[i].email === email) {
          users[i] = newUserData;
          localStorage.setItem('loggedInUser', JSON.stringify(newUserData));
          localStorage.setItem('users', JSON.stringify(users));
          setUser(newUserData); // 상태 직접 업데이트
          return { success: true, message: '회원정보 수정 완료' };
        }
      }
      return { success: false, message: '회원정보 수정에 실패했습니다.' };
    },
    [],
  );

  return { user, login, logout, isLoginLoading, join, updateUser, refreshUser };
};
