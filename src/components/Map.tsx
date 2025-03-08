import { useEffect, useRef } from 'react';

export const Map = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
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

  }, []);
  return <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
};


