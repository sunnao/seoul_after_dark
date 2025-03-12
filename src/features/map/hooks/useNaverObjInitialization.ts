import { useState, useCallback, useEffect } from 'react';

export const useNaverObjInitialization = (isScriptLoading: boolean, scriptError: ErrorEvent | null) => {
  const [isNaverReady, setNaverReady] = useState<boolean>(false);

  // 네이버 객체 준비 확인 - useCallback으로 메모이제이션
  const checkNaverAvailability = useCallback(() => {
    if (window.naver && window.naver.maps) {
      setNaverReady(true);
      return true;
    } else {
      setNaverReady(false);
      return false;
    }
  }, []);

  // 스크립트 로딩 완료 후 naver 객체 유무 확인
  useEffect(() => {
    if (scriptError) return;

    if (!isScriptLoading) {
      // naver 객체 즉시 확인 될 때
      if (checkNaverAvailability()) return;

      // naver 객체 로드 지연 시 반복 확인
      const checkNaver = setInterval(() => {
        if (checkNaverAvailability()) {
          clearInterval(checkNaver);
        }
      }, 500);

      // 5초 후 타임아웃 처리
      const timeoutId = setTimeout(() => {
        clearInterval(checkNaver);
        if (!checkNaverAvailability()) {
          console.error('Naver Maps API failed to initialize');
        }
      }, 5000);

      return () => {
        clearInterval(checkNaver);
        clearTimeout(timeoutId);
      };
    }
  }, [isScriptLoading, scriptError, checkNaverAvailability]);

  return { isNaverReady };
};
