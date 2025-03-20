import { useEffect, useState } from 'react';

export const useScript = (src: string): [boolean, ErrorEvent | null] => {
  const [isLoading, setLoading] = useState<boolean>(true); // 스크립트 로딩중 여부
  const [error, setError] = useState<ErrorEvent | null>(null); // 스크립트 로딩 실패

  useEffect(() => {
    let script: HTMLScriptElement | null = document.querySelector(`script[src="${src}"]`);
    const alreadyLoaded = script !== null;
    
    // script가 없을 때에만 실행 (중복 방지)
    if (!script) {
      script = document.createElement('script');
      script.src = src; // == script.setAttribute('src', src);
      script.async = true; // 다운로드 완료 후 즉시 실행
    }

    const handleLoad = () => setLoading(false);
    const handleError = (err: ErrorEvent) => {
      setError(err);
      setLoading(false);
      console.error(err.message);
    };

    // 이미 로드된 스크립트인 경우 바로 로딩 완료 상태로 설정
    if (alreadyLoaded) {
      setLoading(false);
    } else {
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      document.body.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [src]);

  return [isLoading, error];
};
