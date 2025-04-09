import { User } from '@/features/auth/types/userTypes';
import { useAuthContext } from '@/features/auth/contexts';

export const useAuth = () => {
  const { user, setAppUser } = useAuthContext();

  const login = (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const matchedUser = users.find(
      (storedUser) => storedUser.email === email && storedUser.password === password,
    );

    if (matchedUser) {
      const loggedInUser: User = matchedUser;
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
      setAppUser(loggedInUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    setAppUser(null);
    window.location.href = '/';
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

  const updateUser = (
    email: string,
    password: string,
    name: string,
    favoritePlaceIds?: string[],
  ) => {
    const username = name || email.split('@')[0];
    const newUserData: User = { email, password, username, favoritePlaceIds };

    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    for (let i = 0; i < users.length; i++) {
      if (users[i].email === email) {
        users[i] = newUserData;
        localStorage.setItem('loggedInUser', JSON.stringify(newUserData));
        localStorage.setItem('users', JSON.stringify(users));
        setAppUser(newUserData);
        return { success: true, message: '회원정보 수정 완료' };
      }
    }
    return { success: false, message: '회원정보 수정에 실패했습니다.' };
  };

  return { user, login, logout, join, updateUser };
};
