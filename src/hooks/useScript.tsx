import { useEffect, useState } from 'react';

export const useScript = (src: string): [boolean, ErrorEvent | null] => {
  const [isLoading, setLoading] = useState<boolean>(true); // 스크립트 로딩중 여부
  const [error, setError] = useState<ErrorEvent | null>(null); // 스크립트 로딩 실패

  useEffect(() => {
    let script: HTMLScriptElement | null = document.querySelector(`script[src="${src}"]`);

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

    // script 요소에서 불러오기가 완료되면 발생하는 'load' 이벤트
    script.addEventListener('load', handleLoad);
    // script 요소에서 에러가 생기면 발생하는 'error' 이벤트
    script.addEventListener('error', handleError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [src]);

  return [isLoading, error];
};
