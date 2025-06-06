import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

export const KakaoLogin = () => {
  const { kakaoLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const hasCalled = useRef(false);

  const handleKakaoToken = useCallback(async () => {
    if (hasCalled.current) {
      return;
    }
    hasCalled.current = true;

    if (code) {
      const kakaoAuthResult = await kakaoLogin(code);

      if (kakaoAuthResult) {
        navigate('/');
      } 
    }
  }, [code]);

  useEffect(() => {
    if (code !== null) {
      handleKakaoToken();
    }
  }, [code, handleKakaoToken]);

  return (
    <div className="h-screen">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="spinner">
          <h2>
            잠시만 기다려 주세요!
            <br />
            로그인 중입니다.
          </h2>
        </div>
      </div>
    </div>
  );
};
