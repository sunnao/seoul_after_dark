import {
  EmailUser,
  KakaoTokenResponse,
  User,
  userInfoResponse,
} from '@/features/auth/types/userTypes';
import { useAuthContext } from '@/features/auth/contexts';
import axios from 'axios';
import { useCallback } from 'react';

export const useAuth = () => {
  const { user, setAppUser, authLoading } = useAuthContext();

  const findUserIndex = (users: User[], userData: User): number => {
    return users.findIndex((tempUser) => {
      if (userData.joinType === 'email' && tempUser.joinType === 'email') {
        return tempUser.email === userData.email;
      } else if (userData.joinType === 'kakao' && tempUser.joinType === 'kakao') {
        return tempUser.kakaoMemberId === userData.kakaoMemberId;
      }
      return false;
    });
  };

  const emailLogin = (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const matchedUser = users.find(
      (storedUser) =>
        storedUser.joinType !== 'kakao' &&
        storedUser.email === email &&
        storedUser.password === password,
    );

    if (matchedUser) {
      if (matchedUser.joinType === undefined) {
        const { username, email, password, favoritePlaceIds } = matchedUser;

        const updatedUser: EmailUser = {
          username,
          email,
          password,
          favoritePlaceIds,
          joinType: 'email',
        };
        updateLegacyEmailUser(updatedUser);
        return true;
      }

      localStorage.setItem('loggedInUser', JSON.stringify(matchedUser));
      setAppUser(matchedUser);
      return true;
    }
    return false;
  };

  const updateLegacyEmailUser = (updatedlegacyUser: EmailUser) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    const newUers = users.map((tempUser) =>
      tempUser.joinType !== 'kakao' && tempUser.email === updatedlegacyUser.email
        ? updatedlegacyUser
        : tempUser,
    );
    localStorage.setItem('users', JSON.stringify(newUers));
    localStorage.setItem('loggedInUser', JSON.stringify(updatedlegacyUser));
    setAppUser(updatedlegacyUser);
  };

  // 인가코드로 토큰 발급
  const getKakaoToken = useCallback(async (code: string) => {
    try {
      const url = 'https://kauth.kakao.com/oauth/token';
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
        redirect_url: import.meta.env.VITE_REDIRECT_KAKAO_LOGIN,
        code,
      });

      const result = await axios.post<KakaoTokenResponse>(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      return result.data;
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 사용자 정보 가져오기
  const getUserInfo = useCallback(async (accessToken: string) => {
    try {
      const url = '	https://kapi.kakao.com/v2/user/me';

      const result = await axios.get<userInfoResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        params: { property_keys: ['kakao_account.profile'] },
      });

      return result.data;
    } catch (e) {
      console.error(e);
    }
  }, []);

  const kakaoLogin = useCallback(
    async (code: string) => {
      try {
        const tokenResult = await getKakaoToken(code);

        if (!tokenResult) {
          throw new Error('Token not found');
        }

        const { access_token } = tokenResult;

        const userInfo = await getUserInfo(access_token);
        if (!userInfo) {
          throw new Error('userInfo not found');
        }

        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const kakaoMemberId = userInfo.id.toString();

        // id_token 의 sub(사용자의 회원번호)가 users에 있으면 로그인처리, 없으면 등록
        let matchedUser = users.find(
          (storedUser) =>
            storedUser.joinType === 'kakao' && storedUser.kakaoMemberId === kakaoMemberId,
        );

        if (!matchedUser) {
          const joinResult = join({
            joinType: 'kakao',
            name: userInfo.properties.nickname,
            kakaoMemberId,
          });

          if (joinResult.success) {
            const newUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
            matchedUser = newUsers.find(
              (storedUser) =>
                storedUser.joinType === 'kakao' && storedUser.kakaoMemberId === kakaoMemberId,
            );
          }
        }

        localStorage.setItem('accessToken', access_token);
        sessionStorage.setItem('loggedInUser', JSON.stringify(matchedUser));
        setAppUser(matchedUser!);

        return true;
      } catch (e) {
        console.error('Kakao Login Failed:', e);
        return false;
      }
    },
    [getKakaoToken, getUserInfo, setAppUser],
  );

  const logout = () => {
    if (user?.joinType === 'kakao') {
      localStorage.removeItem('accessToken');
    }
    localStorage.removeItem('loggedInUser');
    setAppUser(null);

    if (user?.joinType === 'email') {
      window.location.href = '/';
    }
  };

  const join = ({
    joinType,
    email,
    password,
    name,
    kakaoMemberId,
  }: {
    joinType: 'email' | 'kakao';
    email?: string;
    password?: string;
    name: string;
    kakaoMemberId?: string;
  }) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    if (joinType === 'email' && password && email) {
      // 이메일 가입
      if (
        users.find((storedUser) => storedUser.joinType === 'email' && storedUser.email === email)
      ) {
        return { success: false, message: '이미 등록된 이메일입니다.' };
      }

      const username = name || email.split('@')[0];
      const newUser: User = { joinType: 'email', username, email, password };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      return { success: true, message: '회원가입 완료' };
    } else if (joinType === 'kakao' && kakaoMemberId) {
      // 카카오 가입
      const newUser: User = {
        joinType: 'kakao',
        username: name,
        kakaoNickname: name,
        kakaoMemberId,
      };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      return { success: true, message: '회원가입 완료' };
    } else {
      return { success: false, message: '비정상적인 접근입니다.' };
    }
  };

  const updateUser = (newUserData: User) => {
    if (!user) {
      logout();
      alert('로그인이 필요한 기능입니다.');
      return { success: false, message: '로그인이 필요한 기능입니다.' };
    }

    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');

    const userIndex = findUserIndex(users, newUserData);

    if (userIndex === -1) {
      return { success: false, message: '회원정보 수정에 실패했습니다.' };
    }

    const updatedUser = { ...users[userIndex], ...newUserData };
    users[userIndex] = updatedUser;

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    setAppUser(updatedUser);

    return { success: true, message: '회원정보 수정 완료' };
  };

  const addFavorite = (placeId: string) => {
    if (!user) {
      logout();
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
  };

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
  };

  return {
    user,
    emailLogin,
    kakaoLogin,
    logout,
    join,
    updateUser,
    authLoading,
    addFavorite,
    deleteFavorite,
  };
};
