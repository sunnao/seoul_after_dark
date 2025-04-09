import { User } from '@/features/auth/types/userTypes';
import { useAuthContext } from '@/features/auth/contexts';

export const useAuth = () => {
  const { user, setAppUser, authLoading } = useAuthContext();

  const login = (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const matchedUser = users.find(
      (storedUser) => storedUser.email === email && storedUser.password === password,
    );

    if (matchedUser) {
      localStorage.setItem('loggedInUser', JSON.stringify(matchedUser));
      setAppUser(matchedUser);

      console.log(user);
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

  const updateUser = (newUserData: User) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    for (let i = 0; i < users.length; i++) {
      if (users[i].email === newUserData.email) {
        users[i] = { ...users[i], ...newUserData };
        localStorage.setItem('loggedInUser', JSON.stringify(users[i]));
        localStorage.setItem('users', JSON.stringify(users));
        setAppUser(users[i]);
        return { success: true, message: '회원정보 수정 완료' };
      }
    }
    return { success: false, message: '회원정보 수정에 실패했습니다.' };
  };
  
  const addFavorite= (placeId: string) => {
    if (!user) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    const updatedUser = { ...user };
    if (updatedUser.favoritePlaceIds === undefined) {
      updatedUser.favoritePlaceIds = [];
    }
    
    if (!updatedUser.favoritePlaceIds.includes(placeId)) {
      updatedUser.favoritePlaceIds.push(placeId);
    }

    updateUser(updatedUser);
  }
  
  const deleteFavorite = (placeId: string) => {
    if (!user) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    const updatedUser = { ...user };
    if (updatedUser.favoritePlaceIds === undefined) {
      updatedUser.favoritePlaceIds = [];
    }
    
    updatedUser.favoritePlaceIds = updatedUser.favoritePlaceIds.filter(
      (savedPlaceId) => savedPlaceId !== placeId,
    );

    
    updateUser(updatedUser);
  }

  return { user, login, logout, join, updateUser, authLoading, addFavorite, deleteFavorite };
};
