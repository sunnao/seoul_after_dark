import { useEffect, useRef } from 'react';
import { useScript } from '../hooks/useScript';

export const Map = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, error] = useScript(
    `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY
    }`
  );

  useEffect(() => {
    if (!isLoading && !error) {
      const { naver } = window;

      if (!naver) return;

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

      const map = new naver.maps.Map(mapRef.current!, mapOptions);
    }
    
  }, [isLoading, error]);
  return (
    <>
      {isLoading ? (
        <div>지도 로딩 중...</div>
      ) : (
        <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
      )}

      {error && <div>지도 로드 실패</div>}
    </>
  );
};


