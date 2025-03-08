import { useEffect, useRef, useState } from 'react';
import { useScript } from '../hooks/useScript';

export const Map = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const [isNaverReady, setNaverReady] = useState(false);

  const [isLoading, scriptError] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`
  );
  const { naver } = window;

  const mapOptions = {
    center: new naver.maps.LatLng(37.5666805, 126.9784147), // 서울 시청
    zoom: 15,
    zoomControl: true,
    zoomControlOptions: {
      style: naver.maps.ZoomControlStyle.LARGE,
      position: naver.maps.Position.TOP_RIGHT,
    },
    mapTypeId: naver.maps.MapTypeId.NORMAL,
  };

  // 스크립트 로딩 완료 후 naver 객체 유무 확인
  useEffect(() => {
    if (scriptError) {
      return;
    }
    if (!isLoading) {
      // naver 객체가 있는지 확인
      if (window.naver && window.naver.maps) {
        setNaverReady(true);
      } else {
        // 스크립트는 로드되었지만 naver 객체가 아직 초기화되지 않은 경우
        const checkNaver = setInterval(() => {
          if (window.naver && window.naver.maps) {
            clearInterval(checkNaver);
            setNaverReady(true);
          }
        }, 500);

        // 일정 시간 후에도 로드되지 않으면 타임아웃 처리
        setTimeout(() => {
          clearInterval(checkNaver);
          if (!window.naver || !window.naver.maps) {
            console.error('Naver Maps API failed to initialize');
          }
        }, 5000);
      }
    }
  }, [isLoading, scriptError]);

  useEffect(() => {
    const { naver } = window;

    const mapOptions = {
      center: new naver.maps.LatLng(37.5666103, 126.9783882),
      mapDataControl: false,
      zoom: 14,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_CENTER,
        style: naver.maps.ZoomControlStyle.SMALL,
      },
    };
    
    if (isNaverReady && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new naver.maps.Map(mapRef.current, mapOptions);
    }
  }, [isNaverReady]);

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
      )}

      {scriptError && <div>지도 로드 실패</div>}
    </>
  );
};
